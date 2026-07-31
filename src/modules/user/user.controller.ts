import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	httpPost,
	next,
	requestBody,
	requestParam,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import {
	CreatePinRequest,
	OnboardingRequest,
	ValidatePhoneRequest,
} from "./user.request.dto"
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
		const users = await this.userService.getAllUsers()
		return this.json(ApiResponse.success(users), 200)
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

	@httpGet("/:id")
	public async getUser(@requestParam("id") id: string) {
		const user = await this.userService.getUser(id)
		return this.json(ApiResponse.success(user), 200)
	}

	@httpPost("/onboard")
	@validateSchema(OnboardingRequest)
	public async onboardUser(
		@requestBody() body: OnboardingRequest,
		@next() nxt: NextFunction,
	) {
		try {
			const data = await this.userService.onboardUser(body)
			return this.json(ApiResponse.success(data, "User onboarded successfully"), 201)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/:id/create-pin")
	@validateSchema(CreatePinRequest)
	public async createPin(
		@requestParam("id") id: string,
		@requestBody() body: CreatePinRequest,
		@next() nxt: NextFunction,
	) {
		try {
			await this.userService.createPin(id, body.pin)
			return this.json(ApiResponse.success({}, "PIN created successfully"), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
