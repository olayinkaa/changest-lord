import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { Prisma } from "@/types/prisma"
import type { DepositWebhookDataDto } from "./webhook.dto"
import type { WebhookRepository } from "./webhook.repository"
import { WEBHOOK_TYPES } from "./webhook.types"

@injectable()
export class WebhookService {
	constructor(@inject(WEBHOOK_TYPES.Repository) private webhookRepo: WebhookRepository) {}

	public async handleWebhook(body: any) {
		const { event } = body
		const log = await this.webhookRepo.createLog({ event, payload: body })

		try {
			let result: any
			switch (event) {
				case "transaction.deposit.success":
					result = await this.handleDepositSuccess(body.data, log.id)
					break
				case "collection.success":
					result = await this.handleCollectionSuccess(body.data, log.id)
					break
				case "collection.failed":
					result = await this.handleCollectionSuccess(body.data, log.id)
					break
				default:
					result = { status: "ignored", message: "Event not handled" }
					await this.webhookRepo.updateLog(log.id, {
						status: "IGNORED",
						response: result,
					})
					pinoLogger.warn({ event }, "Unhandled webhook event received")
					return result
			}

			const status = result.status === "success" ? "SUCCESS" : "IGNORED"
			await this.webhookRepo.updateLog(log.id, { status, response: result })
			return result
		} catch (error: any) {
			await this.webhookRepo.updateLog(log.id, {
				status: "FAILED",
				error: this.formatError(error),
			})
			throw error
		}
	}

	private async handleDepositSuccess(data: DepositWebhookDataDto, logId: string) {
		return this.processWebhookCredit(data, "Deposit", logId)
	}

	private async handleCollectionSuccess(data: DepositWebhookDataDto, logId: string) {
		return this.processWebhookCredit(data, "Change Collection", logId)
	}

	private async processWebhookCredit(data: DepositWebhookDataDto, type: string, logId: string) {
		const { reference, amount, bankReference, bankAccountName, bankAccountNumber } = data

		pinoLogger.info({ webhookPayload: data, type })

		// 1. Idempotency check
		const existingTx = await this.webhookRepo.findTransactionByReference(reference)
		if (existingTx) {
			pinoLogger.info({ reference }, "Transaction already processed, skipping")
			return { status: "already_processed", reference }
		}

		try {
			// 2. Resolve User by Virtual Account Number
			const user = await this.webhookRepo.findUserByVirtualAccount(bankAccountNumber)
			const userId = user?.id

			if (userId) {
				await this.webhookRepo.updateLog(logId, { userId })
			}

			const description = userId
				? `${type} from ${bankAccountName} (Ref: ${reference})`
				: `Company ${type} from ${bankAccountName} (Ref: ${reference})`

			await this.webhookRepo.executeDeposit(new Prisma.Decimal(amount), reference, bankReference, description, userId)

			pinoLogger.info({ reference, amount, userId, type }, `Successful ${type} processed`)

			return { status: "success", reference }
		} catch (error: any) {
			pinoLogger.error({ error, reference, type }, `Failed to process ${type}`)
			throw error
		}
	}

	private formatError(error: any) {
		return {
			message: error.message || "Unknown error occurred",
			stack: error.stack,
			code: error.code || "INTERNAL_ERROR",
			timestamp: new Date().toISOString(),
		}
	}
}
