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

	public async updateUserSecurity(
		userId: string,
		data: { pinAttempts: number; isBlocked: boolean },
	) {
		return prisma.user.update({
			where: { id: userId },
			data,
		})
	}

	public async executeDoubleEntryTransfer(
		userId: string,
		recipientId: string | null,
		amount: Prisma.Decimal,
		fee: Prisma.Decimal,
		reference: string,
		transactionType: TransactionType,
	): Promise<string> {
		const totalDebit = amount.add(fee)

		return prisma.$transaction(async (tx) => {
			// 1. Create the Transaction Header
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference,
					transactionType,
					description: `Transfer ${transactionType} from ${userId} to ${recipientId || "Bank"}`,
				},
			})

			// 2. Lock and Debit Sender
			const senderWallet = await tx.wallet.findFirst({
				where: { userId },
			})

			if (!senderWallet) throw new Error("Sender wallet not found")

			await tx.wallet.update({
				where: { id: senderWallet.id },
				data: { balance: { decrement: totalDebit } },
			})

			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: senderWallet.id,
					amount: totalDebit.mul(-1),
					type: "DEBIT",
					description: `Debit for ${transactionType} - ${reference}`,
				},
			})

			// 3. Credit Recipient (or Transit Wallet)
			let recipientWalletId: string
			if (transactionType === TransactionType.TRANSFER_BANK) {
				const transitWallet = await tx.wallet.findFirst({
					where: { userId: null, type: "TRANSIT", currency: "NGN" },
				})
				if (!transitWallet) throw new Error("Transit wallet not configured")
				recipientWalletId = transitWallet.id
			} else {
				const recWallet = await tx.wallet.findFirst({
					where: { userId: recipientId },
				})
				if (!recWallet) throw new Error("Recipient wallet not found")
				recipientWalletId = recWallet.id
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
					description: `Credit for ${transactionType} - ${reference}`,
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
}
