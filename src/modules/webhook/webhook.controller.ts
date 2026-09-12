import { inject } from "inversify"
import { BaseHttpController, controller, httpPost, requestBody } from "inversify-express-utils"
import type { QueueService } from "@/core/bullmq/queue.service"
import { QUEUE_TYPES } from "@/core/bullmq/queue.types"
import { QUEUE_NAMES } from "@/core/bullmq/queue-name"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { DepositWebhookDto } from "./webhook.dto"
import { WEBHOOK_TYPES } from "./webhook.types"
import type { WebhookService } from "./webhook-service"

@controller("/webhook")
export class WebhookController extends BaseHttpController {
	constructor(
		@inject(WEBHOOK_TYPES.Service) private webhookService: WebhookService,
		@inject(QUEUE_TYPES.QueueService) private queueService: QueueService,
	) {
		super()
	}

	@httpPost("/deposit")
	@validateSchema(DepositWebhookDto)
	public async handleDeposit(@requestBody() body: DepositWebhookDto) {
		// 1. Capture raw event in Audit Log immediately
		const log = await this.webhookService.createLog({
			event: body.event,
			payload: body,
		})

		// 2. Enqueue for async processing
		await this.queueService.publish(QUEUE_NAMES.Webhook, {
			logId: log.id,
			payload: body,
		})

		return ApiResponse.success({
			status: "accepted",
			message: "Webhook received and queued for processing",
			logId: log.id,
		})
	}
}
