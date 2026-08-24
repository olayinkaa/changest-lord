import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	httpPost,
	principal,
	requestBody,
	requestParam,
} from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import { validateSchema } from "@/core/middleware/validate-schema"
import type { UserPrincipal } from "@/providers/user-principal"
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
	@AuthGuard()
	public async validateBvn(
		@requestBody() body: VerifyBvnDto,
		@principal() authUser: UserPrincipal,
	) {
		const result = await this.kycService.validateBvn(authUser.details.id, body.bvn)
		return this.json(ApiResponse.success(result), 200)
	}

	//
	@httpGet("/bvn/cache")
	public async getCachedBvns() {
		const cachedBvns = await this.kycService.getAllCachedBvns()
		return this.json(
			ApiResponse.success(cachedBvns, "Cached BVNs retrieved successfully"),
			200,
		)
	}

	@httpGet("/bvn/cache/:id")
	public async getCachedBvn(@requestParam("id") id: string) {
		const cachedBvns = await this.kycService.getCachedBvnByID(id)
		return this.json(
			ApiResponse.success(cachedBvns, "Cached BVN retrieved successfully"),
			200,
		)
	}
}
