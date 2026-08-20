import type { NextFunction, Request } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	httpPost,
	httpPut,
	next,
	queryParam,
	request,
	requestBody,
	requestParam,
} from "inversify-express-utils"
import { OnboardingScopes } from "@/constants"
import { UnauthorizedException } from "@/core/errors/exceptions"
import { enforceOnboardingScope } from "@/core/middleware/enforce-onboarding-scope"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { type ILiveness, LIVENESS_TYPES } from "../liveness/liveness.type"
import {
	CreatePinRequest,
	OnboardingBusinessProfileRequest,
	OnboardingProfileRequest,
	type SubmitLivenessCaptureRequest,
	ValidatePhoneRequest,
} from "./onboarding.dto"
import { type IOnboardingService, ONBOARDING_TYPES } from "./onboarding.type"

@controller("/onboarding")
export class OnboardingController extends BaseHttpController {
	constructor(
		@inject(ONBOARDING_TYPES.Service)
		private onboardingService: IOnboardingService,
		@inject(LIVENESS_TYPES.Service)
		private readonly livenessService: ILiveness,
	) {
		super()
	}

	@httpPost("/validate-phone")
	@validateSchema(ValidatePhoneRequest)
	public async validatePhone(
		@requestBody() body: ValidatePhoneRequest,
		@next() nxt: NextFunction,
	) {
		try {
			const data = await this.onboardingService.validatePhone(body.phone)
			return this.json(ApiResponse.success(data, "Phone number is available"), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPut("/register/profile")
	@validateSchema(OnboardingProfileRequest)
	@enforceOnboardingScope(OnboardingScopes.PROFILE)
	public async onboardUserProfile(
		@requestBody() body: OnboardingProfileRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const onboardingUser = req.onboardingUser
			if (!onboardingUser) {
				return nxt(
					new UnauthorizedException("Onboarding user is missing from the request."),
				)
			}
			const data = await this.onboardingService.onboardUserProfile(onboardingUser, body)
			return this.json(ApiResponse.success(data, "User onboarded successfully"), 201)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPut("/register/business")
	@validateSchema(OnboardingBusinessProfileRequest)
	@enforceOnboardingScope(OnboardingScopes.BUSINESS)
	public async onboardUserBusiness(
		@requestBody() body: OnboardingBusinessProfileRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const onboardingUser = req.onboardingUser
			if (!onboardingUser) {
				return nxt(
					new UnauthorizedException("Onboarding user session is invalid or expired."),
				)
			}
			const data = await this.onboardingService.onboardBusinessProfile(
				onboardingUser,
				body,
			)
			return this.json(
				ApiResponse.success(data, "Business information submitted successfully"),
				201,
			)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/liveness-initiate")
	@enforceOnboardingScope(OnboardingScopes.LIVENESS)
	public async startLivenessSession(@next() nxt: NextFunction, @request() req: Request) {
		const userId = req.onboardingUser?.id
		if (!userId) {
			return nxt(
				new UnauthorizedException("Onboarding user session is invalid or expired."),
			)
		}
		try {
			const result = await this.livenessService.initiateLivenessSession(userId)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/liveness-result/:sessionId")
	@enforceOnboardingScope(OnboardingScopes.LIVENESS)
	public async getLivenessResult(
		@requestParam("sessionId") sessionId: string,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		const user = req.onboardingUser
		if (!user) {
			return nxt(
				new UnauthorizedException("Onboarding user session is invalid or expired."),
			)
		}
		try {
			const result = await this.livenessService.getLivenessSessionResult(user, sessionId)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/liveness-capture/submit")
	@enforceOnboardingScope(OnboardingScopes.LIVENESS)
	public async submitLivenessCapture(
		@next() nxt: NextFunction,
		@request() req: Request,
		@requestBody() body: SubmitLivenessCaptureRequest,
	) {
		const user = req.onboardingUser
		if (!user) {
			return nxt(
				new UnauthorizedException("Onboarding user session is invalid or expired."),
			)
		}
		try {
			const result = await this.livenessService.submitLivenessSessionCapture(user, body)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/create-pin")
	@validateSchema(CreatePinRequest)
	@enforceOnboardingScope(OnboardingScopes.PIN)
	public async createPin(
		@requestBody() body: CreatePinRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = req.onboardingUser?.id
			if (!userId) {
				return nxt(
					new UnauthorizedException("Onboarding user session is invalid or expired."),
				)
			}
			const data = await this.onboardingService.createPin(userId, body.pin)
			return this.json(ApiResponse.success(data, "Profile Completed"), 200)
		} catch (error) {
			nxt(error)
		}
	}
	//
	@httpGet("/validate-email")
	// @enforceOnboardingScope(OnboardingScopes.PROFILE)
	public async validateEmail(@queryParam("email") email: string) {
		const result = await this.onboardingService.validateEmail(email)
		return this.json(ApiResponse.success(result), 200)
	}
}
