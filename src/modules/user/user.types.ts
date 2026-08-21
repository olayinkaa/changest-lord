// import type { UserCreateInput } from "@/generated/prisma/models";

import type { User } from "@/generated/prisma/client"
import type { PaginatedResponse, PaginatedResult } from "@/types/base"
import type { UserQueryDto, UserResponseDto } from "./user.dto"

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
	findAll(query: UserQueryDto): Promise<PaginatedResult<User>>
	createUserProfile(
		onboardingUser: { id: string; phone: string },
		data: any,
	): Promise<any>
	updateBusinessProfile(userId: string, data: any): Promise<any>
	createUserPhoneNumber(phoneNumber: string): Promise<any>
	findUser(userId: string): Promise<any>
	updateUserPin(userId: string, pinHash: string): Promise<any>
	updateLivenessStatus(
		userId: string,
		imageData: { livenessImageUrl: string; livenessImagePublicId: string },
	): Promise<any>
	findUserByPhone(phone: string): Promise<any>
	findByEmail(email: string): Promise<any | null>
	findByUserId5(userId5: string): Promise<any>
	updateUserPinAndUserId5(userId: string, pinHash: string, userId5?: string): Promise<any>
}

export interface IUserService {
	getAllUsers(query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>>
	getUser(id: string): Promise<any>
}
