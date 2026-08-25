/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: false */
/** biome-ignore-all lint/correctness/noUnusedPrivateClassMembers: false */
import type { AxiosInstance } from "axios"
import axios from "axios"
import type { IVerificationService } from "../verification.types"

export class YouVerifyService implements IVerificationService {
	readonly providerName = "youverify" as const

	private readonly api: AxiosInstance
	constructor() {
		this.api = axios.create({
			baseURL: "https://",
			headers: {},
		})
	}
	//
	public async verifyNIN(_nin: string): Promise<any> {}
	//
	public async verifyBVN(bvn: string): Promise<any> {}
	//
}
