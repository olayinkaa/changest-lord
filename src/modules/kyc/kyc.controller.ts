import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpPost,
	principal,
	requestBody,
} from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import { validateSchema } from "@/core/middleware/validate-schema"
import type { UserPrincipal } from "@/providers/user-principal"
import { ApiResponse } from "@/utils/http-response"
import { VerifyBvnDto } from "./kyc.dto"
import { type IKycService, KYC_TYPES } from "./kyc.types"

@controller("/kyc")
@AuthGuard()
export class KycController extends BaseHttpController {
	constructor(@inject(KYC_TYPES.Service) private kycService: IKycService) {
		super()
	}

	@httpPost("/validate-bvn")
	@validateSchema(VerifyBvnDto)
	public async validateBvn(
		@requestBody() body: VerifyBvnDto,
		@principal() authUser: UserPrincipal,
	) {
		const result = await this.kycService.validateBvn(authUser.details.id, body.bvn)
		return this.json(ApiResponse.success(result), 200)
	}
}
