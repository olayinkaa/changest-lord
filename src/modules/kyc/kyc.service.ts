import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IVerificationService } from "@/adapters/verification/verification.types"
import type { IKycService } from "./kyc.types"

@injectable()
export class KycService implements IKycService {
	constructor(
		@inject(ADAPTER_TYPES.VerificationService)
		private verificationService: IVerificationService,
	) {}
	async validateBVN(bvn: string): Promise<any> {}
}
