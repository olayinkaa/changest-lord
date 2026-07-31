// import type { UserCreateInput } from "@/generated/prisma/models";
import type { OnboardingRequest } from "./user.request.dto"

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
	updateUserPin(userId: string, pinHash: string): Promise<any>
	updateKycPinStatus(userId: string, pinCreated: boolean): Promise<any>
	findUserByPhone(phone: string): Promise<any>
}

export interface IUserService {
	validatePhone(phone: string): Promise<{ phone: string; available: boolean }>
	getAllUsers(): Promise<any[]>
	getUser(id: string): Promise<any>
	onboardUser(data: OnboardingRequest): Promise<any>
	createPin(userId: string, pin: string): Promise<any>
}
