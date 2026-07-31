import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekogniction.type"
import {
	BadRequestException,
	ConflictException,
	UnprocessableEntityException,
} from "@/core/errors/exceptions"
import type { OnboardingRequest } from "./user.dto"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@injectable()
export class UserService implements IUserService {
	livenessRedirectUrl: string = "mychange://"

	constructor(
		@inject(USER_TYPES.Repository)
		private userRepository: IUserRepository,
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
	) {}

	async validatePhone(phone: string): Promise<{ phone: string; available: boolean }> {
		const existing = await this.userRepository.findByPhoneWithKyc(phone)

		// User exists AND has completed onboarding → block the new sign-up.
		if (existing?.kyc?.completedProfile) {
			throw new ConflictException(
				"This phone number is already registered and has completed onboarding",
			)
		}

		// Either no user with this phone, or one that started but hasn't finished onboarding.
		return { phone, available: true }
	}

	async getAllUsers() {
		return this.userRepository.findAllWithKycAndBusiness()
	}

	async onboardUser(data: OnboardingRequest) {
		return this.userRepository.createUserOnboarding(data)
	}

	async initiateLivenessSession(token: string) {
		const sessionToken = token
		const sessionId = this.awsRekognitionService.initiateLivenessSession(sessionToken)
		if (!sessionId) {
			throw new UnprocessableEntityException("Failed to initiate AWS Liveness Session")
		}
		return {
			sessionId,
			sessionToken,
			link: `https://www.myfacecard.ai/liveness?session_id=${sessionId}&redirect_url=${this.livenessRedirectUrl}`,
		}
	}

	async getLivenessSessionResult(sessionId: string) {
		if (!sessionId) {
			throw new BadRequestException("sessionId is required")
		}
		const result = this.awsRekognitionService.getLivenessSessionResult(sessionId)
		return result
	}
}
