// import type { UserCreateInput } from "@/generated/prisma/models";
import type { OnboardingRequest } from "./user.dto"

export const USER_TYPES = {
	Service: Symbol.for("UserService"),
	Repository: Symbol.for("UserRepository"),
}

export interface IUserRepository {
	findByPhoneWithKyc(
		phone: string,
	): Promise<{ id: string; kyc: { completedProfile: boolean } | null } | null>
	findAllWithKycAndBusiness(): Promise<any[]>
	createUserOnboarding(data: any): Promise<any>
	findUser(id: any): Promise<any>
}

export interface IUserService {
	validatePhone(phone: string): Promise<{ phone: string; available: boolean }>
	getAllUsers(): Promise<any[]>
	getUser(id: string): Promise<any>
	onboardUser(data: OnboardingRequest): Promise<any>
}
