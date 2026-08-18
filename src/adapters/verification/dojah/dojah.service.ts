import type { AxiosInstance } from "axios"
import axios from "axios"
import { config } from "@/config/env"
import type { ApiResponse } from "@/types/base"
import type { IVerificationService } from "../verification.types"
import type { IDojahBvnVerificationFullResponse } from "./dojah.types"

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
	public async verifyNIN(nin: string) {}
	//
	public async verifyBVN(bvn: string) {
		const res: ApiResponse<IDojahBvnVerificationFullResponse> = await this.api.get(
			"/api/v1/kyc/bvn/full",
			{
				params: {
					bvn,
				},
			},
		)
		return res.data.entity
	}
	//
	public async verifyBasicPhone(phoneNumber: string) {}
	//
}
