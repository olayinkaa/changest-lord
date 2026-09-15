import { format } from "date-fns"
import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { BadRequestException } from "@/core/errors/exceptions"
import { Prisma } from "@/types/prisma"
import { type ILedgerRepository, LEDGER_TYPES } from "../ledger/ledger.types"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import type { TopUpWalletDto } from "./wallet.dto"
import { type IWalletRepository, type IWalletService, WALLET_TYPES } from "./wallet.types"

@injectable()
export class WalletService implements IWalletService {
	constructor(
		@inject(WALLET_TYPES.Repository)
		private walletRepo: IWalletRepository,
		@inject(USER_TYPES.Repository)
		private userRepo: IUserRepository,
		@inject(LEDGER_TYPES.Repository)
		private ledgerRepo: ILedgerRepository,
	) {}

	private formatEntry(entry: any) {
		const date = new Date(entry.createdAt)
		const isCredit = entry.type === "CREDIT"
		const amount = entry.amount
		// const sign = isCredit ? "+" : "-";

		return {
			id: entry.id,
			title: entry.description,
			//   amount: `${sign}₦${amount.abs().toFixed(2)}`,
			amount: `₦${amount.abs().toFixed(2)}`,
			type: isCredit ? "in" : "out",
			date: format(date, "MMMM dd, yyyy"),
			time: format(date, "HH:mm:ss"),
			status: entry.transaction?.status || "Successful",
		}
	}

	public async getBalance(userId: string) {
		const wallet = await this.walletRepo.findByUserId(userId)
		if (!wallet) {
			// Auto-create wallet if it doesn't exist
			const newWallet = await this.walletRepo.createWallet(userId)
			return { balance: newWallet.balance, currency: newWallet.currency }
		}
		return { balance: wallet.balance, currency: wallet.currency }
	}

	public async topUp(body: TopUpWalletDto) {
		const { identifier, amount } = body

		// 1. Resolve the UUID from phone or userId5
		let user = await this.userRepo.findUserByPhone(identifier)
		if (!user) {
			user = await this.userRepo.findByUserId5(identifier)
		}

		if (!user) {
			throw new BadRequestException(`User not found with identifier: ${identifier}`)
		}

		// 2. Ensure wallet exists before topping up
		let wallet = await this.walletRepo.findByUserId(user.id)
		if (!wallet) {
			wallet = await this.walletRepo.createWallet(user.id)
		}

		return this.walletRepo.topUp(user.id, amount)
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

	public async getRecentTransactions(userId: string, limit: number): Promise<any[]> {
		const entries = await this.ledgerRepo.findRecentByUserId(userId, limit)
		return entries.map((entry) => this.formatEntry(entry))
	}

	public async createWalletForUser(userId: string) {
		const wallet = await this.walletRepo.findByUserId(userId)
		if (wallet) {
			throw new BadRequestException("Wallet already exists for this user")
		}
		return this.walletRepo.createWallet(userId)
	}
}
