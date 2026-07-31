import { injectable } from "inversify"
import type { pino } from "pino"
import { pinoLogger } from "@/config/pino-logger"

export interface IAmazonSesService {
	sendVerificationEmail(email: string): Promise<void>
	verifyEmail(token: string): Promise<boolean>
	sendWelcomeEmail(email: string, userId5: string, virtualAccount: string): Promise<void>
}

@injectable()
export class AmazonSesService implements IAmazonSesService {
	async sendVerificationEmail(email: string): Promise<void> {
		pinoLogger.info({ email }, "Sending verification email via Amazon SES")
		// Integration with AWS SDK SES would go here
		return Promise.resolve()
	}

	async verifyEmail(token: string): Promise<boolean> {
		pinoLogger.info({ token }, "Verifying email token via Amazon SES")
		// Logic to verify token would go here
		return true
	}

	async sendWelcomeEmail(
		email: string,
		userId5: string,
		virtualAccount: string,
	): Promise<void> {
		pinoLogger.info(
			{ email, userId5, virtualAccount },
			"Sending welcome email via Amazon SES",
		)
		// Integration with AWS SDK SES would go here
		return Promise.resolve()
	}
}
