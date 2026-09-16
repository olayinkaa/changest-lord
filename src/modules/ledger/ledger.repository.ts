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
			// We only delete transactions that no longer have any ledger entries
			// This is complex in a single query, so we'll handle it by deleting
			// those that only belong to this user if possible,
			// but for now, let's just delete the ledger entries to resolve constraints.
			// If the user wants the transactions gone too, we can try to delete them.
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
