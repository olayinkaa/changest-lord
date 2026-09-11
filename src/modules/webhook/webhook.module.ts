import { ContainerModule } from "inversify"
import { WebhookController } from "./webhook.controller"
import { WebhookRepository } from "./webhook.repository"
import { WEBHOOK_TYPES } from "./webhook.types"
import { WebhookService } from "./webhook-service"

export const WebhookModule = new ContainerModule((bind) => {
	bind(WEBHOOK_TYPES.Service).to(WebhookService)
	bind(WEBHOOK_TYPES.Repository).to(WebhookRepository)
	bind(WebhookController).toSelf()
})
