import type { AxiosInstance } from "axios"
import axios from "axios"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import {
	BadRequestException,
	ServiceUnavailableException,
} from "@/core/errors/exceptions"
import type { ApiResponse } from "@/types/base"
import { ErrorType } from "@/types/enum"
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
		} catch (err: any) {
			pinoLogger.error({ err }, "BVN verification failed")
			// 1. Extract the exact error string returned by Dojah (e.g., "Invalid BVN")
			if (err.response) {
				throw new BadRequestException(
					"Your BVN does not exist, please enter a valid BVN",
					{
						errorType: ErrorType.BVN_DOES_NOT_EXIST,
					},
				)
			}
			// Case 2: Network error, timeout, or Dojah server is down (no response received)
			throw new ServiceUnavailableException(
				"We are unable to verify your BVN now, please try again later",
			)
		}
	}
}
