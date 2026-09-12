import { inject, injectable } from "inversify"
import type { ISendEmailOptions } from "@/adapters/aws-ses/aws-ses.types"
import { type IQueueService, QUEUE_TYPES } from "@/core/bullmq/queue.types"
import { QUEUE_NAMES } from "@/core/bullmq/queue-name"
import type { IEmailProducer } from "./email.types"

@injectable()
export class EmailProducer implements IEmailProducer {
	constructor(@inject(QUEUE_TYPES.QueueService) private readonly queues: IQueueService) {}

	async sendEmail(opts: ISendEmailOptions) {
		const job = await this.queues.publish(QUEUE_NAMES.Email, {
			to: opts.to,
			subject: opts.subject,
			htmlBody: opts.htmlBody,
			textBody: opts.textBody,
			fromEmail: opts.fromEmail,
			userId: opts.userId,
		})
		return { jobId: job.id }
	}
}
