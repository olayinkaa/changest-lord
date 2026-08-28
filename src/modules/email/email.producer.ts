import { inject, injectable } from "inversify"
import type { ISendEmailOptions } from "@/adapters/aws-ses/aws-ses.types"
import { type IQueueService, QUEUE_NAMES, TYPES } from "@/core/queue/queue.types"
import type { IEmailProducer } from "./email.types"

@injectable()
export class EmailProducer implements IEmailProducer {
	constructor(@inject(TYPES.QueueService) private readonly queues: IQueueService) {}

	async sendTransactional(opts: ISendEmailOptions) {
		const job = await this.queues.publish(QUEUE_NAMES.Email, {
			to: opts.to,
			subject: opts.subject,
			htmlBody: opts.htmlBody,
			textBody: opts.textBody,
			fromEmail: opts.fromEmail,
		})
		return { jobId: job.id }
	}
}
