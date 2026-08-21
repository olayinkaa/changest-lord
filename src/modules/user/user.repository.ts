import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { User } from "@/generated/prisma/client"
import type { PaginatedResult } from "@/types/base"
import type { UserQueryDto } from "./user.dto"
import type { IUserRepository } from "./user.types"

@injectable()
export class UserRepository implements IUserRepository {
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

	async findAll(query: UserQueryDto): Promise<PaginatedResult<User>> {
		const { page, size, emailLike, userType, businessNameLike } = query

		const where: any = {}
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

	async findUser(userId: string) {
		return prisma.user.findUnique({
			where: { id: userId },
			include: {
				kyc: true,
				businessType: true,
			},
		})
	}

	async createUserPhoneNumber(phoneNumber: string) {
		return prisma.user.create({
			data: {
				phone: phoneNumber,
			},
		})
	}

	async createUserProfile(onboardingUser: { id: string; phone: string }, data: any) {
		const { email, firstName, lastName, homeAddress, userType } = data

		const isCustomer = userType?.toLowerCase() === "customer"
		const resolvedStep = isCustomer ? "LIVENESS_PASSED" : "PROFILE_COMPLETED"

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

	async updateBusinessProfile(userId: string, data: any) {
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

	async updateLivenessStatus(
		userId: string,
		imageData: { livenessImageUrl: string; livenessImagePublicId: string },
	) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				onboardingStep: "LIVENESS_PASSED",
				livenessImageUrl: imageData.livenessImageUrl,
				livenessImagePublicId: imageData.livenessImagePublicId,
				kyc: {
					update: {
						livenessDone: true,
					},
				},
			},
		})
	}

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

	async findUserByPhone(phone: string) {
		return prisma.user.findUnique({
			where: { phone },
		})
	}

	async findByEmail(email: string) {
		return prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
			},
		})
	}

	async findByUserId5(userId5: string) {
		return prisma.user.findUnique({
			where: { userId5 },
		})
	}
}
