// import type { UserCreateInput } from "@/generated/prisma/models";

import type { BusinessType, User, UserKyc } from "@/generated/prisma/client"
import type { PaginatedResponse, PaginatedResult } from "@/types/base"
import type { UserQueryDto, UserResponseDto } from "./user.dto"

export const USER_TYPES = {
	Service: Symbol.for("UserService"),
	Repository: Symbol.for("UserRepository"),
}

export type UserWithRelations = User & {
	kyc?: UserKyc | null
	businessType?: BusinessType | null
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
	): Promise<UserWithRelations>
	updateBusinessProfile(userId: string, data: any): Promise<UserWithRelations>
	createUserPhoneNumber(phoneNumber: string): Promise<any>
	findUser(userId: string): Promise<UserWithRelations | null>
	updateUserPin(userId: string, pinHash: string): Promise<any>
	updateLivenessStatus(
		userId: string,
		data: {
			livenessImageUrl: string
			livenessImagePublicId: string
			faceId: string
		},
	): Promise<any>
	findUserByPhone(phone: string): Promise<User | null>
	findByEmail(email: string): Promise<any | null>
	findByUserId5(userId5: string): Promise<User | null>
	findByBusinessName(
		businessName: string,
	): Promise<{ id: string; businessName: string | null } | null>
	updateUserPinAndUserId5(
		userId: string,
		pinHash: string,
		userId5?: string | null,
	): Promise<User>
	findByBvn(bvn: string): Promise<User | null>
	findByNin(bvn: string): Promise<User | null>
	updateBvnVerification(userId: string, bvn: string): Promise<any>
	updateNinVerification(userId: string, nin: string): Promise<any>
	deleteUser(userId: string): Promise<User>
}

export interface IUserService {
	getAllUsers(query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>>
	getUser(id: string): Promise<any>
	deleteUser(id: string): Promise<any>
}
