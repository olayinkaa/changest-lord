import {
	GetEmailAddressInsightsCommand,
	SESv2Client,
	SendEmailCommand,
	type SendEmailCommandInput,
	type SendEmailCommandOutput,
} from "@aws-sdk/client-sesv2"
import { injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import type {
	IAwsSesEmailValidationResponse,
	IAwsSesService,
	ISendEmailOptions,
} from "./aws-ses.types"

@injectable()
export class AwsSesService implements IAwsSesService {
	private sesClient: SESv2Client
	constructor() {
		this.sesClient = new SESv2Client({
			region: process.env.AWS_REGION,
		})
	}
	async checkEmailInsights(
		emailAddress: string,
	): Promise<IAwsSesEmailValidationResponse> {
		try {
			const input = {
				EmailAddress: emailAddress,
			}
			const command = new GetEmailAddressInsightsCommand(input)
			const response = await this.sesClient.send(command)
			return response
		} catch (error) {
			pinoLogger.error({ error }, "Error validating email")
			throw error
		}
	}
	//
	async sendEmail(options: ISendEmailOptions): Promise<SendEmailCommandOutput> {
		try {
			const input: SendEmailCommandInput = {
				FromEmailAddress: options.fromEmail || process.env.MAIL_FROM,
				Destination: {
					ToAddresses: [options.to],
				},
				Content: {
					Simple: {
						Subject: {
							Data: options.subject,
							Charset: "UTF-8",
						},
						Body: {
							...(options.textBody && {
								Text: {
									Data: options.textBody,
									Charset: "UTF-8",
								},
							}),
							...(options.htmlBody && {
								Html: {
									Data: options.htmlBody,
									Charset: "UTF-8",
								},
							}),
						},
					},
				},
			}

			const command = new SendEmailCommand(input)
			const response = await this.sesClient.send(command)

			pinoLogger.info(
				{ messageId: response.MessageId, to: options.to },
				"Email sent successfully via SESv2",
			)
			return response
		} catch (error) {
			pinoLogger.error({ error, to: options.to }, "Error sending email via SESv2")
			throw error
		}
	}
}
