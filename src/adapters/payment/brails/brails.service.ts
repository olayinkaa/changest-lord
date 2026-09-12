import type { AxiosInstance } from "axios"
import axios from "axios"
import { injectable } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { createStaticVirtualAccountPayload, IBrailsService } from "./brails.type"

@injectable()
export class BrailsService implements IBrailsService {
	private readonly api: AxiosInstance
	constructor() {
		this.api = axios.create({
			baseURL: `${config.BRAILS_API_BASE_URL}/api/v2`,
			headers: {
				Authorization: `Bearer ${config.BRAILS_API_KEY}`,
			},
		})
	}

	//
	async createStaticVirtualAccount(payload: createStaticVirtualAccountPayload) {
		const data = {
			...payload,
			bank: "providus",
			currency: "NGN",
			type: "INDIVIDUAL",
		}
		try {
			const res = await this.api.post("/virtual-accounts", data)
			return res
		} catch (e) {
			pinoLogger.error({ error: e }, "Error in fetching place predictions")
			throw e
		}
	}
}
