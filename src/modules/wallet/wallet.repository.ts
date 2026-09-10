import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import { Prisma, type WalletType } from "@/generated/prisma/client"
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

	public async updateBalance(
		walletId: string,
		amount: Prisma.Decimal,
		mode: "ADD" | "SUBTRACT",
	) {
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
}
