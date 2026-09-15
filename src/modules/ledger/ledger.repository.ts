import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { ILedgerRepository } from "./ledger.types"

@injectable()
export class LedgerRepository implements ILedgerRepository {
	public async createTransaction(data: { reference: string; transactionType: any; description: string }) {
		return prisma.ledgerTransaction.create({
			data,
		})
	}

	public async createEntry(data: {
		ledgerTransactionId: string
		walletId: string
		amount: any
		type: any
		description: string
	}) {
		return prisma.ledger.create({
			data,
		})
	}

	public async findByUserId(userId: string) {
		return prisma.ledger.findMany({
			where: {
				wallet: {
					userId,
				},
			},
			include: {
				transaction: true,
				wallet: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		})
	}

	public async findRecentByUserId(userId: string, limit: number) {
		return prisma.ledger.findMany({
			where: {
				wallet: {
					userId,
				},
			},
			include: {
				transaction: true,
				wallet: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		})
	}
}
