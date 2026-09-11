import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { Prisma } from "@/types/prisma"
import { type DepositWebhookDataDto, DepositWebhookDto } from "./webhook.dto"
import type { WebhookRepository } from "./webhook.repository"
import { WEBHOOK_TYPES } from "./webhook.types"

@injectable()
export class WebhookService {
	constructor(@inject(WEBHOOK_TYPES.Repository) private webhookRepo: WebhookRepository) {}

	public async handleWebhook(body: any) {
		const { event, data } = body

		switch (event) {
			case "transaction.deposit.success":
				return this.handleDepositSuccess(data)
			default:
				pinoLogger.warn({ event }, "Unhandled webhook event received")
				return { status: "ignored", message: "Event not handled" }
		}
	}

	private async handleDepositSuccess(data: DepositWebhookDataDto) {
		const { reference, amount, bankReference, bankAccountName } = data

		// 1. Idempotency check
		const existingTx = await this.webhookRepo.findTransactionByReference(reference)
		if (existingTx) {
			pinoLogger.info({ reference }, "Deposit already processed, skipping")
			return { status: "already_processed", reference }
		}

		try {
			const description = `Company Deposit from ${bankAccountName} (Ref: ${reference})`
			await this.webhookRepo.executeDeposit(new Prisma.Decimal(amount), reference, bankReference, description)

			pinoLogger.info({ reference, amount }, "Successful company deposit processed")
			return { status: "success", reference }
		} catch (error: any) {
			pinoLogger.error({ error, reference }, "Failed to process company deposit")
			throw error
		}
	}
}
