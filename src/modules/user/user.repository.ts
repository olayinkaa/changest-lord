import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { User } from "@/generated/prisma/client"
import type { PaginatedResult } from "@/types/base"
import type { UserQueryDto } from "./user.dto"
import type { IUserRepository } from "./user.types"

@injectable()
export class UserRepository implements IUserRepository {
	/**
	 *
	 * @param query
	 * @returns
	 */
	async findAll(query: UserQueryDto): Promise<PaginatedResult<User>> {
		const { page, size, emailLike, userType, businessNameLike, searchLike } = query

		const where: any = {}

		if (searchLike) {
			where.OR = [
				{ firstName: { contains: searchLike, mode: "insensitive" } },
				{ lastName: { contains: searchLike, mode: "insensitive" } },
				{ businessName: { contains: searchLike, mode: "insensitive" } },
			]
		}

		if (businessNameLike) {
			where.branchName = { contains: businessNameLike, mode: "insensitive" }
		}

		if (emailLike) {
			where.email = { contains: emailLike, mode: "insensitive" }
		}

		if (userType) {
			where.userType = userType
		}

		const [content, total] = await Promise.all([
			prisma.user.findMany({
				where,
				skip: (page - 1) * size,
				take: size,
				orderBy: { createdAt: "desc" },
				include: {
					kyc: true,
					businessType: true,
				},
			}),
			prisma.user.count({ where }),
		])

		return { content, total }
	}

	/**
	 *
	 * @param phone
	 * @returns
	 */
	async findByPhoneWithKyc(phone: string) {
		return prisma.user.findUnique({
			where: { phone },
			select: {
				id: true,
				onboardingStep: true,
				phone: true,
				userType: true,
				kyc: {
					select: {
						completedProfile: true,
					},
				},
			},
		})
	}

	/**
	 *
	 * @param userId
	 * @returns
	 */
	async findUser(userId: string) {
		return prisma.user.findUnique({
			where: { id: userId },
			include: {
				kyc: true,
				businessType: true,
			},
		})
	}

	/**
	 *
	 * @param phone
	 * @returns
	 */
	async findUserByPhone(phone: string) {
		return prisma.user.findUnique({
			where: { phone },
		})
	}

	/**
	 *
	 * @param email
	 * @returns
	 */
	async findByEmail(email: string) {
		return prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
			},
		})
	}

	/**
	 * @param businessName
	 * @returns
	 */
	async findByBusinessName(businessName: string) {
		return prisma.user.findFirst({
			where: {
				businessName: {
					equals: businessName,
					mode: "insensitive",
				},
			},
			select: {
				id: true,
				businessName: true,
			},
		})
	}

	/**
	 *
	 * @param bvn
	 * @returns
	 */
	async findByBvn(bvn: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { bvn },
		})
	}

	/**
	 *
	 * @param bvn
	 * @returns
	 */
	async findByNin(nin: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { nin },
		})
	}

	/**
	 *
	 * @param userId5
	 * @returns
	 */
	async findByUserId5(userId5: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { userId5 },
		})
	}

	/**
	 *
	 * @param phoneNumber
	 * @returns
	 */
	async createUserPhoneNumber(phoneNumber: string) {
		return prisma.user.create({
			data: {
				phone: phoneNumber,
			},
		})
	}

	/**
	 *
	 * @param onboardingUser
	 * @param data
	 * @returns
	 */
	async createUserProfile(onboardingUser: { id: string; phone: string }, data: any) {
		const { email, firstName, lastName, homeAddress, userType } = data
		// const isCustomer = userType?.toLowerCase() === "customer";
		// const resolvedStep = isCustomer ? "LIVENESS_PASSED" : "PROFILE_COMPLETED";
		const resolvedStep = "PROFILE_COMPLETED"

		return prisma.user.update({
			where: { id: onboardingUser.id },
			data: {
				email,
				firstName,
				lastName,
				address: homeAddress,
				userType,
				phone: onboardingUser.phone,
				onboardingStep: resolvedStep,
				kyc: {
					create: {
						completedProfile: false,
						phoneVerified: false,
					},
				},
			},
			include: {
				kyc: true,
				businessType: true,
			},
		})
	}

	/**
	 *
	 * @param userId
	 * @param data
	 * @returns
	 */
	async updateBusinessProfile(userId: string, data: any): Promise<User> {
		const { businessName, businessLocation, businessTypeId } = data

		return prisma.user.update({
			where: { id: userId },
			data: {
				businessName,
				businessLocation,
				businessTypeId,
				onboardingStep: "BUSINESS_PROFILE_COMPLETED",
			},
			include: {
				kyc: true,
				businessType: true,
			},
		})
	}

	/**
	 *
	 * @param userId
	 * @param imageData
	 * @returns
	 */
	async updateLivenessStatus(
		userId: string,
		data: {
			livenessImageUrl: string
			livenessImagePublicId: string
			faceId: string
		},
	) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				onboardingStep: "LIVENESS_PASSED",
				livenessImageUrl: data.livenessImageUrl,
				livenessImagePublicId: data.livenessImagePublicId,
				kyc: {
					update: {
						livenessDone: true,
						faceId: data.faceId,
					},
				},
			},
		})
	}

	/**
	 *
	 * @param userId
	 * @param pinHash
	 * @returns
	 */
	async updateUserPin(userId: string, pinHash: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				pinHash,
				onboardingStep: "PIN_COMPLETED",
				kyc: {
					update: {
						pinCreated: true,
						completedProfile: true,
					},
				},
			},
		})
	}

	/**
	 *
	 * @param userId
	 * @param pinHash
	 * @param userId5
	 * @returns
	 */
	async updateUserPinAndUserId5(userId: string, pinHash: string, userId5?: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				pinHash,
				userId5,
				onboardingStep: "PIN_COMPLETED",
				kyc: {
					update: {
						pinCreated: true,
						completedProfile: true,
					},
				},
			},
		})
	}
	//

	/**
	 * @param userId
	 * @returns
	 */
	async deleteUser(userId: string): Promise<User> {
		return prisma.user.delete({
			where: { id: userId },
			include: {
				kyc: true,
			},
		})
	}
	/**
	 * @param userId
	 * @param bvn
	 * @returns
	 */
	async updateBvnVerification(userId: string, bvn: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				bvn,
				kyc: {
					update: {
						bvnVerified: true,
						bvnFaceVerified: true,
					},
				},
			},
		})
	}
	/**
	 * @param userId
	 * @param nin
	 * @returns
	 */
	async updateNinVerification(userId: string, nin: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				nin,
				kyc: {
					update: {
						ninVerified: true,
					},
				},
			},
		})
	}
}
