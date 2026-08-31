import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsSesService } from "@/adapters/aws-ses/aws-ses.types"
import { type IUtilityService, UTILITY_TYPES } from "@/common/utility/utility.type"
import { config } from "@/config/env"
import { OnboardingScopes } from "@/constants"
import { BadRequestException, ConflictException } from "@/core/errors/exceptions"
import { OnboardingStep } from "@/generated/prisma/enums"
import type { IAuthUtils } from "@/modules/auth/auth.types"
import { AUTH_TYPES } from "@/modules/auth/auth.types"
import { ErrorType } from "@/types/enum"
import { mapStepToNextScope } from "@/utils/helper"
import {
	BUSINESS_TYPES,
	type IBusinessTypeService,
} from "../business-type/business-type.types"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import { EMAIL_TYPES, type IEmailProducer } from "../workers/email/email.types"
import type {
	OnboardingBusinessProfileRequest,
	OnboardingProfileRequest,
} from "./onboarding.dto"
import type { IOnboardingService } from "./onboarding.type"

@injectable()
export class OnboardingService implements IOnboardingService {
	livenessRedirectUrl: string = "myChange://"

	constructor(
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
		@inject(BUSINESS_TYPES.Service)
		private businessTypeService: IBusinessTypeService,
		@inject(AUTH_TYPES.AuthUtils) private readonly authUtils: IAuthUtils,
		@inject(UTILITY_TYPES.Service)
		private readonly utilityService: IUtilityService,
		@inject(ADAPTER_TYPES.AmazonSesService)
		private readonly awsSesService: IAwsSesService,
		@inject(EMAIL_TYPES.Producer)
		private readonly emailProducer: IEmailProducer,
	) {}

	/**
	 *
	 * @param phone
	 * @returns
	 */
	async validatePhone(phone: string): Promise<any> {
		const existing = await this.userRepo.findByPhoneWithKyc(phone)

		if (existing) {
			// User exists AND has completed onboarding → block the new sign-up.
			if (existing?.kyc?.completedProfile) {
				throw new ConflictException("This phone number is already registered", {
					phoneNumber:
						"This phone number is already registered and has completed onboarding",
				})
			}

			const nextScope = mapStepToNextScope(existing.onboardingStep, existing?.userType)

			// User exist but has not completed profile

			const payload = {
				userId: existing.id,
				phone: existing.phone,
				userType: existing.userType,
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
				userType: existing.userType,
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

	/**
	 *
	 * @param onboardingUser
	 * @param data
	 * @returns
	 */
	async onboardUserProfile(
		onboardingUser: IOnboardingUser,
		data: OnboardingProfileRequest,
	) {
		if (data.email) {
			const existingEmailUser = await this.userRepo.findByEmail(data.email)
			if (existingEmailUser) {
				throw new ConflictException("This email address is already registered", {
					email: "This email address is already in use by another account",
				})
			}
		}
		// 1. Process profile registration database logic
		const updatedUser = await this.userRepo.createUserProfile(onboardingUser, data)

		if (!updatedUser.email) {
			throw new Error("User email is required to send onboarding notification.")
		}

		// 2. Compute the correct next progressive security access scope
		const nextScope = mapStepToNextScope(
			updatedUser.onboardingStep,
			updatedUser.userType ?? undefined,
		)

		// 3. Assemble structural JWT target payload parameters
		const payload = {
			userId: updatedUser.id,
			phone: updatedUser.phone,
			userType: updatedUser.userType,
			scope: nextScope,
		}

		// 2. Trigger the onboarding welcome email background task
		const htmlBody = this.utilityService.renderEmailTemplate("welcome-email.html", {
			name: updatedUser.firstName ?? "there",
			email: updatedUser.email,
		})

		// 5. Trigger the onboarding welcome email background task
		await this.emailProducer.sendEmail({
			to: updatedUser.email,
			subject: "Welcome to MyChange. 👋",
			htmlBody: htmlBody,
			fromEmail: "olayinka@borgestech.co",
		})

		// 4. Generate the continuous sequential temporary transaction token
		const stepToken = this.authUtils.generateToken(
			payload,
			config.JWT_ONBOARDING_SECRET,
			"15m",
		)

		return {
			description: "Profile details registered successfully.",
			currentStep: updatedUser.onboardingStep,
			userType: updatedUser.userType,
			temporaryToken: stepToken,
		}
	}

	/**
	 *
	 * @param onboardingUser
	 * @param data
	 * @returns
	 */
	async onboardBusinessProfile(
		onboardingUser: IOnboardingUser,
		data: OnboardingBusinessProfileRequest,
	) {
		await this.businessTypeService.getBusinessTypeById(data.businessTypeId)
		// 1. Process profile registration database logic
		const updatedUser = await this.userRepo.updateBusinessProfile(onboardingUser.id, data)

		// 2. Compute the correct next progressive security access scope
		const nextScope = mapStepToNextScope(
			updatedUser.onboardingStep,
			updatedUser.userType ?? undefined,
		)

		// 3. Assemble structural JWT target payload parameters
		const payload = {
			userId: updatedUser.id,
			phone: updatedUser.phone,
			userType: updatedUser.userType,
			scope: nextScope,
		}

		// 4. Generate the continuous sequential temporary transaction token
		const stepToken = this.authUtils.generateToken(
			payload,
			config.JWT_ONBOARDING_SECRET,
			"15m",
		)

		return {
			description: "Business details registered successfully.",
			currentStep: updatedUser.onboardingStep,
			userType: updatedUser.userType,
			temporaryToken: stepToken,
		}
	}

	async createPin(userId: string, pin: string) {
		const pinHash = this.authUtils.hashPin(pin)

		const user = await this.userRepo.findUser(userId)
		if (!user) {
			throw new BadRequestException("User not found", {
				errorType: ErrorType.USER_NOT_FOUND,
			})
		}
		let userId5 = user.userId5

		// if (user.userType === UserType.seller && !userId5) {
		if (!userId5) {
			userId5 = await this.utilityService.generateUniqueUserId5()
		}

		// 3. Update pin and userId5 together
		const updatedUser = await this.userRepo.updateUserPinAndUserId5(
			userId,
			pinHash,
			userId5,
		)

		// Generate an access token for automatic login/dashboard access
		const payload = {
			id: updatedUser.id,
			phone: updatedUser.phone,
			userType: updatedUser.userType,
		}

		const accessToken = this.authUtils.generateToken(
			payload,
			config.JWT_TOKEN_SECRET,
			config.JWT_TOKEN_EXPIRES_IN,
		)

		const refreshToken = this.authUtils.generateToken(
			payload,
			config.JWT_REFRESH_TOKEN_SECRET,
			config.JWT_REFRESH_TOKEN_EXPIRES_IN,
		)

		return {
			description: "PIN created successfully.",
			currentStep: OnboardingStep.PIN_COMPLETED,
			accessToken,
			refreshToken,
		}
	}

	async validateEmail(email: string) {
		// 1. Check if email is already bound to an existing user account in DB
		const existingUser = await this.userRepo.findByEmail(email)
		if (existingUser) {
			throw new BadRequestException("Email already exists", {
				exist: true,
				email: "Email already exists",
			})
		}

		// 2. Fetch mailbox diagnostics using AWS SESv2
		const result = await this.awsSesService.checkEmailInsights(email)
		const mailboxValidation = result.MailboxValidation

		// Optional: Add guards based on AWS validation confidence or disposal status
		const confidenceVerdict = mailboxValidation?.IsValid?.ConfidenceVerdict
		const isDisposable = mailboxValidation?.Evaluations?.IsDisposable?.ConfidenceVerdict

		if (isDisposable === "HIGH") {
			throw new BadRequestException(
				"Disposable or temporary email addresses are not allowed",
				{
					email: "Please use a permanent, valid email address",
				},
			)
		}

		if (confidenceVerdict === "LOW" || confidenceVerdict === "NONE") {
			throw new BadRequestException(
				"The provided email address appears to be invalid or undeliverable",
				{
					email: "Invalid email address format or mailbox",
				},
			)
		}

		return {
			exists: false,
			message: "Email is available and valid",
			data: {
				confidenceVerdict,
				isValid: mailboxValidation?.IsValid,
			},
		}
	}
	/**
	 * @param businessName
	 * @returns
	 */
	async validateBusinessName(businessName: string) {
		const existingBusiness = await this.userRepo.findByBusinessName(businessName)
		if (existingBusiness) {
			throw new BadRequestException("Business name already exists", {
				businessName: "Business name already exists",
			})
		}

		return { exists: false, message: "Business name is available" }
	}
	//
}
