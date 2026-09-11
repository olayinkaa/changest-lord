import { inject, injectable } from "inversify"
import { BaseHttpController, controller, httpPost, requestBody } from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { DepositWebhookDto } from "./webhook.dto"
import { WEBHOOK_TYPES } from "./webhook.types"
import type { WebhookService } from "./webhook-service"

@injectable()
@controller("/webhook")
export class WebhookController extends BaseHttpController {
	constructor(@inject(WEBHOOK_TYPES.Service) private webhookService: WebhookService) {
		super()
	}

	@httpPost("/deposit")
	@validateSchema(DepositWebhookDto)
	public async handleDeposit(@requestBody() body: DepositWebhookDto) {
		const result = await this.webhookService.handleWebhook(body)
		return ApiResponse.success(result)
	}
}
