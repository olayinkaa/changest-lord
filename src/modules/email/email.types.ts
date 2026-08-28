import type { SendEmailCommandOutput } from "@aws-sdk/client-sesv2"
import type { ISendEmailOptions } from "@/adapters/aws-ses/aws-ses.types"

export const EMAIL_TYPES = {
	EmailSender: Symbol.for("EmailSender"),
	Producer: Symbol.for("EmailProducer"),
} as const

export interface IEmailSender {
	send(options: ISendEmailOptions): Promise<SendEmailCommandOutput>
}

export interface IEmailProducer {
	sendTransactional(opts: ISendEmailOptions): Promise<{ jobId: string | undefined }>
}
