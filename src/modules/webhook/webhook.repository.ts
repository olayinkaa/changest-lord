import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import { type Prisma, TransactionType } from "@/generated/prisma/client"

@injectable()
export class WebhookRepository {
	public async findTransactionByReference(reference: string) {
		return prisma.ledgerTransaction.findUnique({
			where: { reference },
		})
	}

	public async executeDeposit(
		amount: Prisma.Decimal,
		reference: string,
		bankReference: string,
		description: string,
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

			// 2. Credit Settlement Wallet
			const settlementWallet = await tx.wallet.findFirst({
				where: { userId: null, type: "SETTLEMENT", currency: "NGN" },
			})

			if (!settlementWallet) {
				throw new Error("Settlement wallet not configured")
			}

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
					description: `External Deposit: ${reference} (Bank Ref: ${bankReference})`,
				},
			})
		})
	}
}
