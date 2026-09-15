import type { NextFunction } from "express"
import { inject } from "inversify"
import { controller, httpGet, httpPost, next, principal, queryParam, requestBody } from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import { validateSchema } from "@/core/middleware/validate-schema"
import type { UserPrincipal } from "@/providers/user-principal"
import { ApiResponse } from "@/utils/http-response"
import {
	ExecuteTransferDto as ExecuteTransferRequest,
	ValidateAmountDto as ValidateAmountRequest,
	ValidateSearchDto,
} from "./transfer.dto"
import { type ITransferService, TRANSFER_TYPES } from "./transfer.types"

@controller("/transfer")
export class TransferController {
	constructor(
		@inject(TRANSFER_TYPES.TransferService)
		private transferService: ITransferService,
	) {}

	@httpPost("/search")
	@validateSchema(ValidateSearchDto)
	@AuthGuard()
	public async search(
		@principal() authUser: UserPrincipal,
		@requestBody() body: ValidateSearchDto,
		@next() nxt: NextFunction,
	) {
		try {
			const userId = authUser?.details?.id
			const result = await this.transferService.searchRecipients(userId, body.phoneOrUserId)
			return ApiResponse.success(result)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/validate-search")
	@validateSchema(ValidateSearchDto)
	@AuthGuard()
	public async validateSearch(
		@principal() authUser: UserPrincipal,
		@next() nxt: NextFunction,
		@requestBody() body: ValidateSearchDto,
	) {
		try {
			const userId = authUser?.details?.id
			const result = await this.transferService.validateRecipients(userId, body.phoneOrUserId)
			return ApiResponse.success(result)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/validate-amount")
	@validateSchema(ValidateAmountRequest)
	public async validateAmount(
		@requestBody() body: ValidateAmountRequest,
		@principal() authUser: UserPrincipal,
		@next() nxt: NextFunction,
	) {
		try {
			const userId = authUser?.details?.id
			const result = await this.transferService.validateAmount(userId, body)
			return ApiResponse.success(result)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/execute")
	@validateSchema(ExecuteTransferRequest)
	@AuthGuard()
	public async execute(@requestBody() body: ExecuteTransferRequest, @principal() authUser: UserPrincipal) {
		const userId = authUser?.details?.id
		const result = await this.transferService.executeTransfer(userId, body)
		return ApiResponse.success(result)
	}

	@httpGet("/transit")
	public async getTransit(@next() nxt: NextFunction, @queryParam("account") account?: string) {
		try {
			const result = await this.transferService.getTransitTransactions(account)
			return ApiResponse.success(result)
		} catch (error) {
			nxt(error)
		}
	}
}
