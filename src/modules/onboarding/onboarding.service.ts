import bcrypt from "bcryptjs"
import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAmazonSesService } from "@/adapters/amazon-ses/amazon-ses.service"
import type { IAnchorApiSdk } from "@/adapters/anchor-api-sdk/anchor.service"
import type { AwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekognition.service"
import { prisma } from "@/core/database/db"
import { BadRequestException, ConflictException } from "@/core/errors/exceptions"
import { generateUniqueUserId5 } from "@/utils/id-generator"
import type { IOnboardingRepository, IOnboardingService } from "./onboarding.types"
import { ONBOARDING_TYPES } from "./onboarding.types"

@injectable()
export class OnboardingService implements IOnboardingService {
	constructor(
		@inject(ONBOARDING_TYPES.Repository)
		private onboardingRepository: IOnboardingRepository,
		@inject(ADAPTER_TYPES.AmazonSesService)
		private sesService: IAmazonSesService,
		@inject(ADAPTER_TYPES.AnchorApiSdk)
		private anchorService: IAnchorApiSdk,
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private rekognitionService: AwsRekognitionService,
	) {}

	async validatePhone(phone: string): Promise<{ phone: string; available: boolean }> {
		const existing = await this.onboardingRepository.findUserByPhone(phone)
		if (existing) {
			throw new ConflictException("User exists. Log in or use another phone number")
		}
		return { phone, available: true }
	}

	async saveDetails(userId: string, data: any): Promise<any> {
		// Email validation via SES
		await this.sesService.verifyEmail(data.email)
		return this.onboardingRepository.updateUserDetails(userId, data)
	}

	async setUserType(userId: string, type: string): Promise<any> {
		return this.onboardingRepository.updateUserRole(
			userId,
			type === "customer" ? "user" : "merchant",
		)
	}

	async processSellerBusiness(userId: string, data: any): Promise<any> {
		return this.onboardingRepository.updateSellerDetails(userId, data)
	}

	async initiateLiveness(userId: string): Promise<{ sessionId: string }> {
		// We would normally need a token for the session
		const session = await this.rekognitionService.initiateLivenessSession("dummy-token")
		return { sessionId: session.sessionId }
	}

	async verifyLiveness(userId: string, sessionId: string): Promise<boolean> {
		const result = await this.rekognitionService.getLivenessSessionResult(sessionId)
		if (result.confidence < 0.9) {
			throw new BadRequestException(
				"Liveness check failed. Please retake the face capture.",
			)
		}
		return true
	}

	async finalizeSecurity(userId: string, pin: string): Promise<{ userId5: string }> {
		const pinHash = await bcrypt.hash(pin, 10)
		const userId5 = await generateUniqueUserId5(prisma)

		await this.onboardingRepository.updateSecurityInfo(userId, pinHash, userId5)

		// Create Virtual Account via Anchor
		const user = await this.onboardingRepository.updateUserDetails(userId, {}) // Get user
		const account = await this.anchorService.createVirtualAccount(
			user.phone,
			user.email || "",
		)

		// Save account info
		await this.onboardingRepository.updateUserDetails(userId, {
			virtualAccountNo: account.accountNumber,
		})

		return { userId5 }
	}

	async completeOnboarding(userId: string, deviceData: any): Promise<void> {
		await this.onboardingRepository.bindDevice(userId, deviceData)

		const user = await this.onboardingRepository.updateUserDetails(userId, {})
		await this.sesService.sendWelcomeEmail(user.email || "", "NEW_ID", "NEW_ACC")

		await this.onboardingRepository.updateKycStatus(userId, { completedProfile: true })
	}
}
