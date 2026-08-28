import type { Job } from "bullmq"
import { inject, injectable } from "inversify"
import { config } from "@/config/env"
import { BaseProcessor } from "@/core/queue/base.processor"
import { type EmailJobPayload, QUEUE_NAMES } from "@/core/queue/queue.types"
import { EMAIL_TYPES, type IEmailSender } from "./email.types"

@injectable()
export class EmailProcessor extends BaseProcessor<typeof QUEUE_NAMES.Email> {
	public readonly queueName = QUEUE_NAMES.Email
	protected readonly concurrency = config.QUEUE_EMAIL_CONCURRENCY
	protected readonly rateLimit = {
		max: config.QUEUE_EMAIL_RATE_MAX,
		duration: config.QUEUE_EMAIL_RATE_DURATION_MS,
	}

	constructor(@inject(EMAIL_TYPES.EmailSender) private readonly sender: IEmailSender) {
		super()
	}

	protected async handle(
		data: EmailJobPayload,
		_job: Job<EmailJobPayload>,
	): Promise<void> {
		await this.sender.send({
			to: data.to,
			subject: data.subject,
			htmlBody: data.htmlBody,
			textBody: data.textBody,
			fromEmail: data.fromEmail,
		})
	}
}
