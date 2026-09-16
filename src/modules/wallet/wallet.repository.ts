import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import { Prisma, TransactionStatus, type WalletType } from "@/generated/prisma/client"
import type { IWalletRepository } from "./wallet.types"

@injectable()
export class WalletRepository implements IWalletRepository {
	public async findByUserId(userId: string) {
		return prisma.wallet.findFirst({
			where: { userId },
		})
	}

	public async findById(walletId: string) {
		return prisma.wallet.findUnique({
			where: { id: walletId },
		})
	}

	public async findByType(type: WalletType) {
		return prisma.wallet.findFirst({
			where: { type },
		})
	}

	public async updateBalance(walletId: string, amount: Prisma.Decimal, mode: "ADD" | "SUBTRACT") {
		const operator = mode === "ADD" ? "increment" : "decrement"
		return prisma.wallet.update({
			where: { id: walletId },
			data: {
				balance: {
					[operator]: amount,
				},
			},
		})
	}

	public async createWallet(userId: string, currency: string = "NGN") {
		return prisma.wallet.create({
			data: {
				userId,
				currency,
				balance: new Prisma.Decimal(0),
			},
		})
	}

	public async topUp(userId: string, amount: Prisma.Decimal) {
		const wallet = await this.findByUserId(userId)
		if (!wallet) throw new Error("Wallet not found for user")

		return prisma.wallet.update({
			where: { id: wallet.id },
			data: { balance: { increment: amount } },
		})
	}

	public async executeTransitClaim(phone: string, userId: string, amount: Prisma.Decimal, ledgerId: string) {
		return prisma.$transaction(async (tx) => {
			// Mark the original credit as claimed to prevent double-claiming
			await tx.ledger.update({
				where: { id: ledgerId },
				data: { claimed: true },
			})

			// 1. Transaction Header
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference: `CLAIM-${Date.now()}-${phone}`,
					transactionType: "TRANSFER_MYCHANGE",
					description: `Claiming pending transit funds for phone ${phone}`,
					status: TransactionStatus.SUCCESS,
				},
			})

			// 2. Debit Transit Wallet
			const transitWallet = await tx.wallet.findFirst({
				where: { userId: null, type: "TRANSIT", currency: "NGN" },
			})
			if (!transitWallet) throw new Error("Transit wallet not configured")

			await tx.wallet.update({
				where: { id: transitWallet.id },
				data: { balance: { decrement: amount } },
			})

			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: transitWallet.id,
					amount: amount.mul(-1),
					type: "DEBIT",
					description: `Debit transit for claim ${ledgerTx.reference}`,
				},
			})

			// 3. Credit User Wallet
			const userWallet = await tx.wallet.findFirst({
				where: { userId },
			})
			if (!userWallet) throw new Error("User wallet not found")

			await tx.wallet.update({
				where: { id: userWallet.id },
				data: { balance: { increment: amount } },
			})

			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: userWallet.id,
					amount: amount,
					type: "CREDIT",
					description: `Credit user for claim ${ledgerTx.reference}`,
				},
			})

			return ledgerTx.reference
		})
	}

	public async deleteByUserId(userId: string): Promise<void> {
		const wallet = await this.findByUserId(userId)
		if (wallet) {
			await prisma.wallet.delete({
				where: { id: wallet.id },
			})
		}
	}
}
