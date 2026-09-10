import { injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import type { Decimal } from "@/types/base"

export interface IBankAdapter {
	transferFunds(
		accountNumber: string,
		bankCode: string,
		amount: Decimal,
		reference: string,
	): Promise<{
		status: "SUCCESS" | "FAILED"
		transactionId?: string
		errorMessage?: string
	}>
}

@injectable()
export class BankAdapter implements IBankAdapter {
	async transferFunds(
		accountNumber: string,
		bankCode: string,
		amount: Decimal,
		reference: string,
	): Promise<{
		status: "SUCCESS" | "FAILED"
		transactionId?: string
		errorMessage?: string
	}> {
		pinoLogger.info({ accountNumber, bankCode, amount, reference }, "Executing outbound bank transfer via BankAdapter")

		try {
			// This is where the actual integration with a payment gateway (e.g., Anchor, Paystack, Flutterwave) would happen.
			// For now, we simulate a successful transfer.

			// Simulate network latency
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// In a real scenario, you would call an external API here.
			// Example:
			// const response = await this.paymentGateway.transfer({ ... });

			return {
				status: "SUCCESS",
				transactionId: `BANK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
			}
		} catch (error: any) {
			pinoLogger.error({ error }, "Bank transfer failed")
			return {
				status: "FAILED",
				errorMessage: error.message || "An unexpected error occurred during bank transfer",
			}
		}
	}
}
