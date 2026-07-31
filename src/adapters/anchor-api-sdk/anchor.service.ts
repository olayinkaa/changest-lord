import { injectable } from "inversify"
import type { pino } from "pino"

export interface IAnchorApiSdk {
	createVirtualAccount(
		phone: string,
		email: string,
	): Promise<{ accountNumber: string; accountName: string }>
}

@injectable()
export class AnchorApiSdkService implements IAnchorApiSdk {
	constructor(private logger: pino.Logger) {}

	async createVirtualAccount(
		phone: string,
		email: string,
	): Promise<{ accountNumber: string; accountName: string }> {
		this.logger.info({ phone, email }, "Creating virtual account via Anchor API")
		// Integration with Anchor API would go here
		return {
			accountNumber: `12345678${Math.floor(Math.random() * 100000000)}`,
			accountName: "MyChange User",
		}
	}
}
