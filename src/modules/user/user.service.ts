import { inject, injectable } from "inversify"
import { ConflictException } from "@/core/errors/exceptions"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@injectable()
export class UserService implements IUserService {
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
}
