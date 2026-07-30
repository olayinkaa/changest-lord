import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	httpPost,
	next,
	requestBody,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { UserRequest, ValidatePhoneRequest } from "./user.dto"
import type { IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@controller("/users")
export class UserController extends BaseHttpController {
	constructor(
		@inject(USER_TYPES.Service)
		private userService: IUserService,
	) {
		super()
	}

	@httpGet("/")
	public async getUsers() {
		return this.json(
			ApiResponse.success([
				{ email: "john@example.com", id: 1, name: "John Doe" },
				{ email: "jane@example.com", id: 2, name: "Jane Smith" },
			]),
			200,
		)
	}

	@httpPost("/")
	@validateSchema(UserRequest)
	public async createUser(@requestBody() body: UserRequest, @next() nxt: NextFunction) {
		try {
			return this.json(ApiResponse.success(body), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/validate-phone")
	@validateSchema(ValidatePhoneRequest)
	public async validatePhone(
		@requestBody() body: ValidatePhoneRequest,
		@next() nxt: NextFunction,
	) {
		try {
			const data = await this.userService.validatePhone(body.phone)
			return this.json(ApiResponse.success(data, "Phone number is available"), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
