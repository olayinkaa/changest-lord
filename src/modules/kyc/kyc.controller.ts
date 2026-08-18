import { inject } from "inversify"
import { BaseHttpController } from "inversify-express-utils"
import { type IKycService, KYC_TYPES } from "./kyc.types"

export class KycController extends BaseHttpController {
	constructor(@inject(KYC_TYPES.Service) private kycService: IKycService) {
		super()
	}

	public async validateBVN() {}
}
