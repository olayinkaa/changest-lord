import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	httpPost,
	next,
	queryParam,
	requestBody,
	requestParam,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { OnboardingRequest, UserRequest, ValidatePhoneRequest } from "./user.dto"
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

	@httpPost("/start-liveness-session")
	public async startLivenessSession(
		@queryParam("token") token: string,
		@next() nxt: NextFunction,
	) {
		try {
			const result = await this.userService.initiateLivenessSession(token)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	@httpGet("/get-liveness-result/:sessionId")
	public async getLivenessSessionResult(
		@requestParam("sessionId") sessionId: string,
		@next() nxt: NextFunction,
	) {
		try {
			const result = await this.userService.getLivenessSessionResult(sessionId)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	//end here
}
