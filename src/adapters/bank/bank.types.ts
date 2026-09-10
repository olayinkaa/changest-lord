import type { Prisma } from "@/generated/prisma/client"

export interface IBankAdapter {
	transferFunds(
		accountNumber: string,
		bankCode: string,
		amount: Prisma.Decimal,
		transactionId: string,
	): Promise<BankTransferResult>
}

export interface BankTransferResult {
	success: boolean
	transactionId?: string
	error?: string
}
