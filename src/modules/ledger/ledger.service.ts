import { format } from "date-fns"
import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { BadRequestException } from "@/core/errors/exceptions"
import { Prisma } from "@/types/prisma"
import { type ILedgerRepository, type ILedgerService, LEDGER_TYPES } from "./ledger.types"

@injectable()
export class LedgerService implements ILedgerService {
	constructor(
		@inject(LEDGER_TYPES.Repository)
		private ledgerRepo: ILedgerRepository,
	) {}

	private formatEntry(entry: any) {
		const date = new Date(entry.createdAt)
		const isCredit = entry.type === "CREDIT"
		const amount = entry.amount

		return {
			id: entry.id,
			title: entry.description,
			amount: `₦${amount.abs().toFixed(2)}`,
			type: isCredit ? "CREDIT" : "DEBIT",
			direction: isCredit ? "in" : "out",
			date: format(date, "MMMM dd, yyyy"),
			time: format(date, "HH:mm:ss"),
			status: entry.transaction?.status || "Successful",
			reference: entry.transaction?.reference || "",
		}
	}

	public async createTransaction(data: any) {
		return this.ledgerRepo.createTransaction(data)
	}

	public async createEntry(data: any) {
		return this.ledgerRepo.createEntry(data)
	}

	public async getTransactionHistory(userId: string): Promise<any> {
		const entries = await this.ledgerRepo.findByUserId(userId)
		pinoLogger.info({ entries })

		const sectionsMap: Record<string, any> = {}

		for (const entry of entries) {
			const date = new Date(entry.createdAt)
			const month = format(date, "MMMM")

			if (!sectionsMap[month]) {
				sectionsMap[month] = {
					month,
					totalIn: new Prisma.Decimal(0),
					totalOut: new Prisma.Decimal(0),
					totalFees: new Prisma.Decimal(0),
					totalOutWithFees: new Prisma.Decimal(0),
					data: [],
				}
			}

			const isCredit = entry.type === "CREDIT"
			const amount = entry.amount
			const isFee = entry.description?.toLowerCase().includes("fee") ?? false

			if (isCredit) {
				sectionsMap[month].totalIn = sectionsMap[month].totalIn.add(amount)
			} else {
				const absAmount = amount.mul(-1)
				if (isFee) {
					sectionsMap[month].totalFees = sectionsMap[month].totalFees.add(absAmount)
				} else {
					sectionsMap[month].totalOut = sectionsMap[month].totalOut.add(absAmount)
				}
			}

			sectionsMap[month].data.push(this.formatEntry(entry))
		}

		const content = Object.values(sectionsMap).map((section: any) => {
			const combinedOut = section.totalOut.add(section.totalFees)

			return {
				...section,
				totalIn: `₦${section.totalIn.toFixed(2)}`,
				totalOut: `₦${section.totalOut.toFixed(2)}`,
				totalFees: `₦${section.totalFees.toFixed(2)}`,
				totalOutWithFees: `₦${combinedOut.toFixed(2)}`,
			}
		})

		return { content }
	}

	public async getTransactionByReference(reference: string) {
		const tx = await this.ledgerRepo.findTransactionByReference(reference)

		if (!tx) {
			throw new BadRequestException(`Transaction not found with reference: ${reference}`)
		}

		const creditLedger = tx.ledgers.find((l: any) => l.type === "CREDIT")
		const debitLedger = tx.ledgers.find((l: any) => l.type === "DEBIT")

		const recipientUser = creditLedger?.wallet?.user
		const senderUser = debitLedger?.wallet?.user

		return {
			transactionId: tx.id,
			reference: tx.reference,
			status: tx.status,
			type: tx.transactionType,
			date: tx.createdAt,
			recipient: {
				account: recipientUser?.phone || recipientUser?.userId5 || tx.recipientAccount || "External/System",
				firstName: recipientUser?.firstName,
				lastName: recipientUser?.lastName,
			},
			sender: {
				name: senderUser ? `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() : "External/System",
				phone: senderUser?.phone || "External/System",
				userId: senderUser?.userId5,
			},
			isDebit: !!debitLedger,
			isCredit: !!creditLedger,
		}
	}

	public async getLedgerEntryDetails(id: string) {
		const entry = await this.ledgerRepo.findLedgerById(id)

		if (!entry) {
			throw new BadRequestException(`Ledger entry not found with ID: ${id}`)
		}

		// The current user for this specific ledger entry
		const user = entry.wallet?.user

		// To find the other party, we look at the other ledger entries in the same transaction
		const transactionLedgers = entry.transaction?.ledgers || []
		const otherEntries = transactionLedgers.filter((l: any) => l.id !== entry.id)
		const oppositeEntry = otherEntries.find((l: any) => l.type !== entry.type)
		const oppositeUser = oppositeEntry?.wallet?.user

		const userDetails = {
			name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "System/External",
			phone: user?.phone || "N/A",
			userId5: user?.userId5 || "N/A",
		}

		// For external deposits, the sender is not a User but we can extract details from the description
		let senderName = oppositeUser
			? `${oppositeUser.firstName || ""} ${oppositeUser.lastName || ""}`.trim()
			: "System/External"
		const senderPhone = oppositeUser?.phone || "N/A"
		const senderUserId5 = oppositeUser?.userId5 || "N/A"

		if (!oppositeUser && entry.transaction) {
			const desc = entry.description || ""
			// Pattern: "Deposit from [Name] (Ref: ...)" or "Change Collection from [Name] (Ref: ...)"
			const match = desc.match(/(?:Deposit|Change Collection) from (.*?) \(Ref: /)
			if (match?.[1]) {
				senderName = match[1].trim()
			}
		}

		const counterPartyDetails = {
			name: senderName,
			phone: senderPhone,
			userId5: senderUserId5,
		}

		return {
			entryId: entry.id,
			amount: entry.amount,
			type: entry.type,
			description: entry.description,
			date: entry.createdAt,
			transaction: {
				id: entry.transaction?.id,
				reference: entry.transaction?.reference,
				status: entry.transaction?.status,
				type: entry.transaction?.transactionType,
			},
			...(entry.type === "DEBIT"
				? {
						sender: userDetails,
						receiver: counterPartyDetails,
					}
				: {
						sender: counterPartyDetails,
						receiver: userDetails,
					}),
		}
	}

	public async getRecentTransactions(userId: string, limit: number): Promise<any[]> {
		const entries = await this.ledgerRepo.findRecentByUserId(userId, limit)
		return entries.map((entry) => this.formatEntry(entry))
	}
}
