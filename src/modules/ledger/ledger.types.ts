import type { LedgerType, TransactionType } from "@/generated/prisma/enums"
import type { Decimal } from "@/types/prisma"

export interface ILedgerRepository {
	createTransaction(data: { reference: string; transactionType: TransactionType; description: string }): Promise<any>
	createEntry(data: {
		ledgerTransactionId: string
		walletId: string
		amount: Decimal
		type: LedgerType
		description: string
	}): Promise<any>
}

export interface ILedgerService {
	createTransaction(data: { reference: string; transactionType: TransactionType; description: string }): Promise<any>
	createEntry(data: {
		ledgerTransactionId: string
		walletId: string
		amount: Decimal
		type: LedgerType
		description: string
	}): Promise<any>
}

export const LEDGER_TYPES = {
	Service: Symbol.for("LedgerService"),
	Repository: Symbol.for("LedgerRepository"),
}
