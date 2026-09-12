import type { Job } from "bullmq"
import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { BaseProcessor } from "@/core/bullmq/base.processor"
import { QUEUE_NAMES } from "@/core/bullmq/queue-name"
import { WEBHOOK_TYPES } from "@/modules/webhook/webhook.types"
import type { WebhookService } from "@/modules/webhook/webhook-service"

@injectable()
export class WebhookWorker extends BaseProcessor<typeof QUEUE_NAMES.Webhook> {
	public readonly queueName = QUEUE_NAMES.Webhook
	protected readonly concurrency = 5
	protected override readonly rateLimit = undefined

	constructor(
		@inject(WEBHOOK_TYPES.Service)
		private readonly webhookService: WebhookService,
	) {
		super()
	}

	protected async handle(data: any, job: Job<any>): Promise<void> {
		const { logId, payload } = data
		pinoLogger.info({ jobId: job.id, logId }, "Processing webhook job")

		await this.webhookService.handleWebhookWithLogId(payload, logId)
	}
}
