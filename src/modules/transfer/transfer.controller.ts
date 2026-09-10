import { inject } from "inversify"
import {
	controller,
	httpGet,
	httpPost,
	principal,
	queryParam,
	requestBody,
} from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import { validateSchema } from "@/core/middleware/validate-schema"
import type { UserPrincipal } from "@/providers/user-principal"
import { ApiResponse } from "@/utils/http-response"
import {
	ExecuteTransferDto as ExecuteTransferRequest,
	ValidateAmountDto as ValidateAmountRequest,
} from "./transfer.dto"
import { type ITransferService, TRANSFER_TYPES } from "./transfer.types"

@controller("/transfer")
@AuthGuard()
export class TransferController {
	constructor(
		@inject(TRANSFER_TYPES.TransferService)
		private transferService: ITransferService,
	) {}

	@httpGet("/search")
	public async search(@queryParam("query") query: string) {
		const result = await this.transferService.searchRecipients(query)
		return ApiResponse.success(result)
	}

	@httpPost("/validate-amount")
	@validateSchema(ValidateAmountRequest)
	public async validateAmount(
		@requestBody() body: ValidateAmountRequest,
		@principal() authUser: UserPrincipal,
	) {
		const result = await this.transferService.validateAmount(authUser.details.id, body)
		return ApiResponse.success(result)
	}

	@httpPost("/execute")
	@validateSchema(ExecuteTransferRequest)
	public async execute(
		@requestBody() body: ExecuteTransferRequest,
		@principal() authUser: UserPrincipal,
	) {
		const result = await this.transferService.executeTransfer(authUser.details.id, body)
		return ApiResponse.success(result)
	}
}
