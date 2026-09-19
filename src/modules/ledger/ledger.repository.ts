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
		previousBalance?: any
		newBalance?: any
	}) {
		return prisma.ledger.create({
			data: {
				ledgerTransactionId: data.ledgerTransactionId,
				walletId: data.walletId,
				amount: data.amount,
				type: data.type,
				description: data.description,
				previousBalance: data.previousBalance ?? 0,
				newBalance: data.newBalance ?? 0,
			},
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

	public async findTransactionByReference(reference: string) {
		return prisma.ledgerTransaction.findUnique({
			where: { reference },
			include: {
				ledgers: {
					include: {
						wallet: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		})
	}

	public async findLedgerById(id: string) {
		return prisma.ledger.findUnique({
			where: { id },
			include: {
				transaction: {
					include: {
						ledgers: {
							include: {
								wallet: {
									include: {
										user: true,
									},
								},
							},
						},
					},
				},
				wallet: {
					include: {
						user: true,
					},
				},
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

	public async deleteByUserId(userId: string): Promise<void> {
		const wallet = await prisma.wallet.findFirst({
			where: { userId },
		})

		if (!wallet) return

		const ledgers = await prisma.ledger.findMany({
			where: { walletId: wallet.id },
			select: { ledgerTransactionId: true },
		})

		const transactionIds = ledgers.map((l) => l.ledgerTransactionId)

		await prisma.$transaction([
			prisma.ledger.deleteMany({
				where: { walletId: wallet.id },
			}),
		])

		// Cleanup orphaned transactions
		if (transactionIds.length > 0) {
			for (const txId of transactionIds) {
				const remaining = await prisma.ledger.count({
					where: { ledgerTransactionId: txId },
				})
				if (remaining === 0) {
					await prisma.ledgerTransaction.delete({
						where: { id: txId },
					})
				}
			}
		}
	}
}
