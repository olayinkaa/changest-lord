import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import { type Prisma, TransactionType } from "@/generated/prisma/client"
import type { ITransferRepository } from "./transfer.types"

@injectable()
export class TransferRepository implements ITransferRepository {
	public async searchRecipients(query: string) {
		return prisma.user.findFirst({
			where: {
				OR: [{ phone: query }, { userId5: query }],
			},
		})
	}

	public async getUserById(userId: string) {
		return prisma.user.findUnique({
			where: { id: userId },
		})
	}

	public async updateUserSecurity(userId: string, data: { pinAttempts: number; isBlocked: boolean }) {
		return prisma.user.update({
			where: { id: userId },
			data,
		})
	}

	public async executeDoubleEntryTransfer(
		userId: string,
		recipientUserId: string | null,
		amount: Prisma.Decimal,
		fee: Prisma.Decimal,
		reference: string,
		transactionType: TransactionType,
		recipientAccount?: string,
	): Promise<string> {
		const totalDebit = amount.add(fee)

		return prisma.$transaction(async (tx) => {
			// 1. Create the Transaction Header
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference,
					transactionType,
					recipientAccount: recipientAccount,
					description: `Transfer ${transactionType} from ${userId} to ${recipientUserId || recipientAccount || "Bank"}`,
				},
			})

			// 2. Lock and Debit Sender
			const senderWallet = await tx.wallet.findFirst({
				where: { userId },
			})

			if (!senderWallet) throw new Error("Sender wallet not found")
			if (senderWallet.balance.lt(totalDebit)) {
				throw new Error("Insufficient funds to complete the transfer")
			}

			// Debit Principal Amount
			await tx.wallet.update({
				where: { id: senderWallet.id },
				data: { balance: { decrement: amount } },
			})

			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: senderWallet.id,
					amount: amount.mul(-1),
					type: "DEBIT",
					description: `Debit for ${transactionType} - ${reference}`,
				},
			})

			// Debit Fee (as a separate transaction item)
			if (fee.gt(0)) {
				await tx.wallet.update({
					where: { id: senderWallet.id },
					data: { balance: { decrement: fee } },
				})

				await tx.ledger.create({
					data: {
						ledgerTransactionId: ledgerTx.id,
						walletId: senderWallet.id,
						amount: fee.mul(-1),
						type: "DEBIT",
						description: `Transfer fee for ${transactionType} - ${reference}`,
					},
				})
			}

			// 3. Credit Recipient (or Transit Wallet)
			let recipientWalletId: string
			let userWallet = null

			if (recipientUserId) {
				userWallet = await tx.wallet.findFirst({
					where: { userId: recipientUserId },
				})
			}

			if (userWallet) {
				recipientWalletId = userWallet.id
			} else if (transactionType === TransactionType.TRANSFER_BANK || transactionType === TransactionType.GIVE_CHANGE) {
				const transitWallet = await tx.wallet.findFirst({
					where: { userId: null, type: "TRANSIT", currency: "NGN" },
				})
				if (!transitWallet) throw new Error("Transit wallet not configured")
				recipientWalletId = transitWallet.id
			} else {
				throw new Error("Recipient wallet not found")
			}

			await tx.wallet.update({
				where: { id: recipientWalletId },
				data: { balance: { increment: amount } },
			})
			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: recipientWalletId,
					amount: amount,
					type: "CREDIT",
					description: `Credit for ${transactionType} - ${reference}${!recipientUserId ? ` (Pending Claim for ${recipientAccount || "Unknown"})` : ""}`,
				},
			})

			// 4. Credit System Wallet (Fees)
			if (fee.gt(0)) {
				const systemWallet = await tx.wallet.findFirst({
					where: { userId: null, type: "SYSTEM_FEE", currency: "NGN" },
				})
				if (!systemWallet) throw new Error("System wallet not configured")

				await tx.wallet.update({
					where: { id: systemWallet.id },
					data: { balance: { increment: fee } },
				})
				await tx.ledger.create({
					data: {
						ledgerTransactionId: ledgerTx.id,
						walletId: systemWallet.id,
						amount: fee,
						type: "CREDIT",
						description: `Fee for ${transactionType} - ${reference}`,
					},
				})
			}

			return ledgerTx.reference
		})
	}

	public async executeSettlementSweep(amount: Prisma.Decimal, reference: string): Promise<string> {
		return prisma.$transaction(async (tx) => {
			// 1. Header
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference,
					transactionType: TransactionType.SETTLEMENT_SWEEP,
					description: `Settlement sweep of funds from SYSTEM_FEE to SETTLEMENT wallet`,
				},
			})

			// 2. Debit SYSTEM_FEE
			const feeWallet = await tx.wallet.findFirst({
				where: { userId: null, type: "SYSTEM_FEE", currency: "NGN" },
			})
			if (!feeWallet) throw new Error("SYSTEM_FEE wallet not configured")

			await tx.wallet.update({
				where: { id: feeWallet.id },
				data: { balance: { decrement: amount } },
			})
			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: feeWallet.id,
					amount: amount.mul(-1),
					type: "DEBIT",
					description: `Sweep debit: ${reference}`,
				},
			})

			// 3. Credit SETTLEMENT
			const settlementWallet = await tx.wallet.findFirst({
				where: { userId: null, type: "SETTLEMENT", currency: "NGN" },
			})
			if (!settlementWallet) throw new Error("SETTLEMENT wallet not configured")

			await tx.wallet.update({
				where: { id: settlementWallet.id },
				data: { balance: { increment: amount } },
			})
			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: settlementWallet.id,
					amount: amount,
					type: "CREDIT",
					description: `Sweep credit: ${reference}`,
				},
			})

			return ledgerTx.reference
		})
	}

	public async updateTransactionStatus(reference: string, status: any) {
		await prisma.ledgerTransaction.update({
			where: { reference },
			data: { status },
		})
	}
}
