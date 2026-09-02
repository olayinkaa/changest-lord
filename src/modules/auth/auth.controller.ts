import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpPost,
	next,
	requestBody,
} from "inversify-express-utils"
import { loginRateLimit } from "@/core/middleware/rate-limit"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { LoginRequest } from "./auth.dto"
import type { IAuthService } from "./auth.types"
import { AUTH_TYPES } from "./auth.types"

@controller("/auth")
export class AuthController extends BaseHttpController {
	constructor(
		@inject(AUTH_TYPES.AuthService)
		private authService: IAuthService,
	) {
		super()
	}

	@httpPost("/login")
	@loginRateLimit()
	@validateSchema(LoginRequest)
	public async login(
		@requestBody() body: LoginRequest,
		@next() nxt: NextFunction,
	): Promise<unknown> {
		try {
			const data = await this.authService.login(body)
			return this.json(ApiResponse.success(data, "Login successful"), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
