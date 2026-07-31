import { inject, injectable } from "inversify"
import { ConflictException } from "@/core/errors/exceptions"
import type { OnboardingRequest } from "./user.dto"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@injectable()
export class UserService implements IUserService {
	livenessRedirectUrl: string = "mychange://"

	constructor(
		@inject(USER_TYPES.Repository)
		private userRepository: IUserRepository,
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

	async getUser(id: string) {
		return this.userRepository.findUser(id)
	}

	async onboardUser(data: OnboardingRequest) {
		return this.userRepository.createUserOnboarding(data)
	}
}
