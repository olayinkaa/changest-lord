import type { AxiosInstance } from "axios"
import axios from "axios"
import type { IVerificationService } from "../verification.types"

export class YouVerifyService implements IVerificationService {
	private readonly api: AxiosInstance
	constructor() {
		this.api = axios.create({
			baseURL: "https://",
			headers: {},
		})
	}
	//
	public async verifyNIN(_nin: string) {}
	//
	public async verifyBVN(_bvn: string) {}
	//
	public async verifyBasicPhone(_phoneNumber: string) {}
}
