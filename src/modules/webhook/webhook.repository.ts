import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import { type Prisma, TransactionType, type WebhookLog } from "@/generated/prisma/client"

@injectable()
export class WebhookRepository {
	public async createLog(data: { event: string; payload: any }): Promise<WebhookLog> {
		return prisma.webhookLog.create({
			data: {
				event: data.event,
				payload: data.payload,
				status: "PENDING",
			},
		})
	}

	public async updateLog(id: string, data: Partial<any>): Promise<void> {
		await prisma.webhookLog.update({
			where: { id },
			data,
		})
	}

	public async findTransactionByReference(reference: string) {
		return prisma.ledgerTransaction.findUnique({
			where: { reference },
		})
	}

	public async findUserByVirtualAccount(accountNo: string) {
		return prisma.user.findUnique({
			where: { virtualAccountNo: accountNo },
		})
	}

	public async executeDeposit(
		amount: Prisma.Decimal,
		reference: string,
		bankReference: string,
		description: string,
		userId?: string,
	): Promise<void> {
		await prisma.$transaction(async (tx) => {
			// 1. Create Transaction Header
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference,
					transactionType: TransactionType.DEPOSIT,
					description,
					status: "SUCCESS",
				},
			})

			// 2. Resolve Target Wallet
			let targetWalletId: string

			if (userId) {
				// User Deposit: Credit the User's Wallet
				const userWallet = await tx.wallet.findFirst({
					where: { userId },
				})

				if (!userWallet) {
					throw new Error(`Wallet not found for user ${userId}`)
				}
				targetWalletId = userWallet.id
			} else {
				// Company Deposit: Credit Settlement Wallet
				const settlementWallet = await tx.wallet.findFirst({
					where: { userId: null, type: "SETTLEMENT", currency: "NGN" },
				})

				if (!settlementWallet) {
					throw new Error("Settlement wallet not configured")
				}
				targetWalletId = settlementWallet.id
			}

			// 3. Update Balance
			await tx.wallet.update({
				where: { id: targetWalletId },
				data: { balance: { increment: amount } },
			})

			// 4. Create Ledger Entry
			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: targetWalletId,
					amount: amount,
					type: "CREDIT",
					description: `External Deposit: ${reference} (Bank Ref: ${bankReference})`,
				},
			})
		})
	}
}
