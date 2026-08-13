// import type { UserCreateInput } from "@/generated/prisma/models";

export const USER_TYPES = {
	Service: Symbol.for("UserService"),
	Repository: Symbol.for("UserRepository"),
}

export interface IUserRepository {
	findByPhoneWithKyc(phone: string): Promise<{
		id: string
		phone: string
		onboardingStep: any
		userType: any
		kyc: { completedProfile: boolean } | null
	} | null>
	findAllWithKycAndBusiness(): Promise<any[]>
	createUserOnboarding(
		onboardingUser: { id: string; phone: string },
		data: any,
	): Promise<any>
	createUserPhoneNumber(phoneNumber: string): Promise<any>
	findUser(id: any): Promise<any>
	updateUserPin(userId: string, pinHash: string): Promise<any>
	updateLivenessStatus(userId: string): Promise<any>
	findUserByPhone(phone: string): Promise<any>
	findByEmail(email: string): Promise<any | null>
}

export interface IUserService {
	getAllUsers(): Promise<any[]>
	getUser(id: string): Promise<any>
}
