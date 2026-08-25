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
import { VerifyBvnDto } from "../bvn/bvn.dto"
import { BVN_TYPES, type IBvnService } from "../bvn/bvn.types"
import { VerifyNinDto } from "../nin/nin.dto"
import { type INinService, NIN_TYPES } from "../nin/nin.types"

@controller("/kyc")
export class KycController extends BaseHttpController {
	constructor(
		@inject(NIN_TYPES.Service) private ninService: INinService,
		@inject(BVN_TYPES.Service) private bvnService: IBvnService,
	) {
		super()
	}

	@httpPost("/validate-bvn")
	@validateSchema(VerifyBvnDto)
	@AuthGuard()
	public async validateBvn(
		@requestBody() body: VerifyBvnDto,
		@principal() authUser: UserPrincipal,
	) {
		const result = await this.bvnService.validateBvn(authUser.details.id, body.bvn)
		return this.json(ApiResponse.success(result), 200)
	}

	//
	@httpGet("/bvn/cache")
	public async getCachedBvns() {
		const cachedBvns = await this.bvnService.getAllCachedBvns()
		return this.json(
			ApiResponse.success(cachedBvns, "Cached BVNs retrieved successfully"),
			200,
		)
	}

	@httpGet("/bvn/cache/:id")
	public async getCachedBvn(@requestParam("id") id: string) {
		const cachedBvns = await this.bvnService.getCachedBvnByID(id)
		return this.json(
			ApiResponse.success(cachedBvns, "Cached BVN retrieved successfully"),
			200,
		)
	}

	// NIN
	@httpPost("/validate-nin")
	@validateSchema(VerifyNinDto)
	@AuthGuard()
	public async validateNin(
		@requestBody() body: VerifyNinDto,
		@principal() authUser: UserPrincipal,
	) {
		const result = await this.ninService.validateNin(authUser.details.id, body.nin)
		return this.json(ApiResponse.success(result), 200)
	}

	//
	@httpGet("/nin/cache")
	public async getCachedNins() {
		const cachedBvns = await this.ninService.getAllCachedNins()
		return this.json(
			ApiResponse.success(cachedBvns, "Cached NINs retrieved successfully"),
			200,
		)
	}

	@httpGet("/nin/cache/:id")
	public async getCachedNin(@requestParam("id") id: string) {
		const cachedBvns = await this.ninService.getCachedNinByID(id)
		return this.json(
			ApiResponse.success(cachedBvns, "Cached NIN retrieved successfully"),
			200,
		)
	}
	//
}
