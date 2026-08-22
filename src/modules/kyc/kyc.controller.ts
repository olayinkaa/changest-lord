import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpPost,
	requestBody,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { VerifyBvnDto } from "./kyc.dto"
import { type IKycService, KYC_TYPES } from "./kyc.types"

@controller("/kyc")
export class KycController extends BaseHttpController {
	constructor(@inject(KYC_TYPES.Service) private kycService: IKycService) {
		super()
	}

	@httpPost("/validate-bvn")
	@validateSchema(VerifyBvnDto)
	public async validateBvn(@requestBody() body: VerifyBvnDto) {
		const result = await this.kycService.validateBvn(body.bvn)
		return this.json(ApiResponse.success(result), 200)
	}
}
