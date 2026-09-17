import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import type { SseService } from "@/modules/sse/sse.service"
import { SSE_TYPES, SseEvent } from "@/modules/sse/sse.types"
import { Prisma } from "@/types/prisma"
import type { DepositWebhookDataDto } from "./webhook.dto"
import type { WebhookRepository } from "./webhook.repository"
import { WEBHOOK_TYPES } from "./webhook.types"

@injectable()
export class WebhookService {
	constructor(
		@inject(WEBHOOK_TYPES.Repository) private webhookRepo: WebhookRepository,
		@inject(SSE_TYPES.Service) private sseService: SseService,
	) {}

	public async createLog(data: { event: string; payload: any }) {
		return this.webhookRepo.createLog(data)
	}

	public async handleWebhook(body: any) {
		const { event } = body
		const log = await this.webhookRepo.createLog({ event, payload: body })

		return this.handleWebhookWithLogId(body, log.id)
	}

	public async handleWebhookWithLogId(body: any, logId: string) {
		const { event } = body

		try {
			let result: any
			switch (event) {
				case "transaction.deposit.success":
					result = await this.handleDepositSuccess(body.data, logId)
					break
				case "collection.success":
					result = await this.handleCollectionSuccess(body.data, logId)
					break
				default:
					result = { status: "ignored", message: "Event not handled" }
					await this.webhookRepo.updateLog(logId, {
						status: "IGNORED",
						response: result,
					})
					pinoLogger.warn({ event }, "Unhandled webhook event received")
					return result
			}

			const status = result.status === "success" ? "SUCCESS" : "IGNORED"
			await this.webhookRepo.updateLog(logId, { status, response: result })
			return result
		} catch (error: any) {
			await this.webhookRepo.updateLog(logId, {
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
		const { reference, amount, bankReference, bankAccountName, bankAccountNumber, sourceBankAccountName } = data

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

			let description = ""
			if (type === "Deposit") {
				description = `Deposit from ${bankAccountName}`
			} else if (type === "Change Collection") {
				description = `Change Collection from ${bankAccountName}`
			} else {
				description = `${type} from ${bankAccountName} (Ref: ${reference})`
			}

			const newBalance = await this.webhookRepo.executeDeposit(
				new Prisma.Decimal(amount),
				reference,
				bankReference,
				description,
				sourceBankAccountName,
				userId,
			)

			// Emit SSE event for real-time balance update
			if (userId) {
				await this.sseService.emitEvent(userId, SseEvent.BalanceUpdated, {
					newBalance: newBalance.toString(),
					currency: "NGN",
					transactionId: reference,
					changeAmount: amount,
					changeType: "CREDIT",
				})
			}

			//  send email notification

			pinoLogger.info(
				{ reference, amount, userId, type, newBalance: newBalance.toString() },
				`Successful ${type} processed`,
			)

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
