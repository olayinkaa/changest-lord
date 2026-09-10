import { injectable } from "inversify"
import type { Prisma } from "@/generated/prisma/client"
import type { BankTransferResult, IBankAdapter } from "./bank.types"

@injectable()
export class BankAdapterImpl implements IBankAdapter {
	public async transferFunds(
		accountNumber: string,
		bankCode: string,
		amount: Prisma.Decimal,
		transactionId: string,
	): Promise<BankTransferResult> {
		console.log(
			`Triggering bank transfer to ${accountNumber} at bank ${bankCode} for amount ${amount} with txId ${transactionId}`,
		)

		return {
			success: true,
			transactionId: `BANK-${Date.now()}`,
		}
	}
}
