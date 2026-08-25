import { GetEmailAddressInsightsCommand, SESv2Client } from "@aws-sdk/client-sesv2"
import { injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import type { IAwsSesEmailValidationResponse, IAwsSesService } from "./aws-ses.types"

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
}
