import type { AxiosInstance } from "axios"
import axios from "axios"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { ApiResponse } from "@/types/base"
import type { IVerificationService } from "../verification.types"
import type { IDojahBvnFullResponse } from "./dojah.types"

export class DojaService implements IVerificationService {
	private readonly api: AxiosInstance
	constructor() {
		this.api = axios.create({
			baseURL: config.DOJAH_API_URL,
			headers: {
				Authorization: config.DOJAH_API_KEY,
				AppId: config.DOJAH_APP_ID,
			},
		})
	}
	//
	public async verifyNIN(_nin: string) {}
	//
	public async verifyBVN(bvn: string) {
		try {
			const res: ApiResponse<IDojahBvnFullResponse> = await this.api.get(
				"/api/v1/kyc/bvn/full",
				{
					params: {
						bvn,
					},
				},
			)
			return res.data.entity
		} catch (err) {
			pinoLogger.error({ err }, "BVN verification failed")
			throw err
		}
	}
	//
	public async verifyBasicPhone(_phoneNumber: string) {}
	//
}
