import type { Job } from "bullmq"
import { inject, injectable } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { BaseProcessor } from "@/core/queue/base.processor"
import type { EmailJobPayload } from "@/core/queue/payloads"
import { QUEUE_NAMES } from "@/core/queue/queue-name"
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
		job: Job<EmailJobPayload>,
	): Promise<void> {
		pinoLogger.info(
			{
				jobId: job.id,
				to: data.to,
				attempt: job.attemptsMade + 1,
			},
			"Processing email delivery",
		)
		// pinoLogger.info({ jobId: job.id }, "Processing email job...");

		await this.sender.send({
			to: data.to,
			subject: data.subject,
			htmlBody: data.htmlBody,
			textBody: data.textBody,
			fromEmail: data.fromEmail,
		})
	}
}
