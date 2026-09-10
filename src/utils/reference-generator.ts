import type { TransactionType } from "@/generated/prisma/enums"

const TYPE_PREFIXES: Record<TransactionType, string> = {
	TRANSFER_MYCHANGE: "TMB",
	TRANSFER_BANK: "TBN",
	GIVE_CHANGE: "GCH",
}

/**
 * Generates a professional, human-readable transaction reference.
 * Format: MYCH-[TYPE]-[YYYYMMDD]-[RANDOM]
 * Example: MYCH-TMB-20260910-X7Y2P
 */
export function generateTransactionReference(type: TransactionType): string {
	const prefix = TYPE_PREFIXES[type] || "GEN"
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
	const random = Math.random().toString(36).substring(2, 8).toUpperCase()

	return `MYCH-${prefix}-${date}-${random}`
}
