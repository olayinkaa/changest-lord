import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
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

	async findAllWithKycAndBusiness() {
		return prisma.user.findMany({
			include: {
				kyc: true,
				businessType: true,
			},
			orderBy: {
				createdAt: "desc", // Sorts by newest records first
			},
		})
	}

	async findUser(id: string) {
		return prisma.user.findUnique({
			where: { id },
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
						livenessDone: isCustomer, // Mark true if customer to align with liveness skip
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
				onboardingStep: "BUSINESSS_PROFILE_COMPLETED",
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

	async findUserByPhone(phone: string) {
		return prisma.user.findUnique({
			where: { phone },
		})
	}
	//
	// Inside UserRepository class
	async findByEmail(email: string) {
		return prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
			},
		})
	}
}
