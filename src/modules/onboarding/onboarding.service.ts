import { inject, injectable } from "inversify"
import { config } from "@/config/env"
import { OnboardingScopes } from "@/constants"
import { ConflictException } from "@/core/errors/exceptions"
import { OnboardingStep } from "@/generated/prisma/enums"
import type { IAuthUtils } from "@/modules/auth/auth.types"
import { AUTH_TYPES } from "@/modules/auth/auth.types"
import { mapStepToNextScope } from "@/utils/helper"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import type { OnboardingRequest } from "./onboarding.dto"
import type { IOnboardingService } from "./onboarding.type"

@injectable()
export class OnboardingService implements IOnboardingService {
	livenessRedirectUrl: string = "myChange://"

	constructor(
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
		@inject(AUTH_TYPES.AuthUtils) private readonly authUtils: IAuthUtils,
	) {}

	async validatePhone(phone: string): Promise<any> {
		const existing = await this.userRepo.findByPhoneWithKyc(phone)

		if (existing) {
			// User exists AND has completed onboarding → block the new sign-up.
			if (existing?.kyc?.completedProfile) {
				throw new ConflictException(
					"This phone number is already registered",
					// "This phone number is already registered and has completed onboarding",
				)
			}

			const nextScope = mapStepToNextScope(existing.onboardingStep)

			// User exist but has not completed profile

			const payload = {
				userId: existing.id,
				phone: existing.phone,
				scope: nextScope,
			}

			const resumptionToken = this.authUtils.generateToken(
				payload,
				config.JWT_ONBOARDING_SECRET,
				"15m",
			)

			return {
				description: "Resuming incomplete registration",
				currentStep: existing.onboardingStep,
				temporaryToken: resumptionToken,
			}
		}

		// New User coming for the first time

		const newUser = await this.userRepo.createUserPhoneNumber(phone)
		const newPayload = {
			userId: newUser.id,
			phone: newUser.phone,
			scope: OnboardingScopes.PROFILE,
		}

		const onboardingProfileToken = this.authUtils.generateToken(
			newPayload,
			config.JWT_ONBOARDING_SECRET,
			"15m",
		)

		return {
			description: "Phone number validated successfully.",
			currentStep: OnboardingStep.PHONE_VALIDATED,
			temporaryToken: onboardingProfileToken,
		}
	}

	async onboardUser(onboardingUser: IOnboardingUser, data: OnboardingRequest) {
		return this.userRepo.createUserOnboarding(onboardingUser, data)
	}

	async createPin(userId: string, pin: string) {
		const pinHash = this.authUtils.hashPin(pin)
		await this.userRepo.updateUserPin(userId, pinHash)
		return {
			message: "PIN created successfully.",
			nextStep: OnboardingStep.COMPLETED,
		}
	}
}
