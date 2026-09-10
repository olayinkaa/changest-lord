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
}
