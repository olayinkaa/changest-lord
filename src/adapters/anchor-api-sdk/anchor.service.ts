import { injectable } from "inversify"
import type { pino } from "pino"
import { pinoLogger } from "@/config/pino-logger"

export interface IAnchorApiSdk {
	createVirtualAccount(
		phone: string,
		email: string,
	): Promise<{ accountNumber: string; accountName: string }>
}

@injectable()
export class AnchorApiSdkService implements IAnchorApiSdk {
	async createVirtualAccount(
		phone: string,
		email: string,
	): Promise<{ accountNumber: string; accountName: string }> {
		pinoLogger.info({ phone, email }, "Creating virtual account via Anchor API")
		// Integration with Anchor API would go here
		return {
			accountNumber: `12345678${Math.floor(Math.random() * 100000000)}`,
			accountName: "MyChange User",
		}
	}
}
