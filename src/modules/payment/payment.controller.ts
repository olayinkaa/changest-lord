import type { NextFunction } from "express"
import { inject } from "inversify"
import { BaseHttpController, controller, httpPost, next, principal } from "inversify-express-utils"
import { NotFoundException } from "@/core/errors/exceptions"
import { AuthGuard } from "@/core/guards/auth.guard"
import type { UserPrincipal } from "@/providers/user-principal"
import { ApiResponse } from "@/utils/http-response"
import { type IPaymentService, PAYMENT_TYPES } from "./payment.type"

const blockEndpointMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
	next(new NotFoundException("This endpoint is disabled"))
}

@controller("/payment")
@AuthGuard()
export class PaymentController extends BaseHttpController {
	constructor(
		@inject(PAYMENT_TYPES.Service)
		private readonly paymentService: IPaymentService,
	) {
		super()
	}

	@httpPost("/static-account", blockEndpointMiddleware)
	public async createStaticAccount(@next() nxt: NextFunction, @principal() authUser: UserPrincipal) {
		const userId = authUser?.details?.id
		try {
			const res = await this.paymentService.createUserVirtualAccount(userId, "2222222222")
			return this.json(ApiResponse.success(res), 201)
		} catch (error) {
			nxt(error)
		}
	}
}
