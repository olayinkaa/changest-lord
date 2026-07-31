import type { NextFunction, Request } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpPost,
	next,
	request,
	requestBody,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import {
	CompleteOnboardingRequest,
	LivenessVerifyRequest,
	SecurityRequest,
	SellerBusinessRequest,
	UserDetailsRequest,
	UserTypeRequest,
	ValidatePhoneRequest,
} from "./onboarding.dto"
import type { IOnboardingService } from "./onboarding.types"
import { ONBOARDING_TYPES } from "./onboarding.types"

@controller("/onboarding")
export class OnboardingController extends BaseHttpController {
	constructor(
		@inject(ONBOARDING_TYPES.Service)
		private onboardingService: IOnboardingService,
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
			return this.json(ApiResponse.success(data, "Phone number is valid"), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/details")
	@validateSchema(UserDetailsRequest)
	public async saveDetails(
		@requestBody() body: UserDetailsRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			const data = await this.onboardingService.saveDetails(userId, body)
			return this.json(ApiResponse.success(data, "Details saved successfully"), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/user-type")
	@validateSchema(UserTypeRequest)
	public async setUserType(
		@requestBody() body: UserTypeRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			const data = await this.onboardingService.setUserType(userId, body.type)
			return this.json(ApiResponse.success(data, "User type updated"), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/seller/business")
	@validateSchema(SellerBusinessRequest)
	public async processSellerBusiness(
		@requestBody() body: SellerBusinessRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			const data = await this.onboardingService.processSellerBusiness(userId, body)
			return this.json(ApiResponse.success(data, "Business details saved"), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/seller/liveness/init")
	public async initiateLiveness(@next() nxt: NextFunction, @request() req: Request) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			const data = await this.onboardingService.initiateLiveness(userId)
			return this.json(ApiResponse.success(data), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/seller/liveness/verify")
	@validateSchema(LivenessVerifyRequest)
	public async verifyLiveness(
		@requestBody() body: LivenessVerifyRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			const result = await this.onboardingService.verifyLiveness(userId, body.sessionId)
			return this.json(
				ApiResponse.success({ verified: result }, "Liveness verified"),
				200,
			)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/security")
	@validateSchema(SecurityRequest)
	public async finalizeSecurity(
		@requestBody() body: SecurityRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			const data = await this.onboardingService.finalizeSecurity(userId, body.pin)
			return this.json(ApiResponse.success(data, "Security setup complete"), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpPost("/complete")
	@validateSchema(CompleteOnboardingRequest)
	public async completeOnboarding(
		@requestBody() body: CompleteOnboardingRequest,
		@next() nxt: NextFunction,
		@request() req: Request,
	) {
		try {
			const userId = (req as any).user?.id || (req.query.userId as string)
			if (!userId) return this.json(ApiResponse.error("User ID is required"), 400)

			await this.onboardingService.completeOnboarding(userId, body)
			return this.json(ApiResponse.success({}, "Onboarding completed successfully"), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
