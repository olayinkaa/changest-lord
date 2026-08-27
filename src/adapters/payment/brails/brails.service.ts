import type { AxiosInstance } from "axios"
import axios from "axios"
import { config } from "@/config/env"
import type { IBrailsService } from "./brails.type"

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
	async createVirtualAccount() {}
}
