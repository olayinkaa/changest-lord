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

	async createUserOnboarding(onboardingUser: { id: string; phone: string }, data: any) {
		const {
			email,
			firstName,
			lastName,
			address,
			userType,
			businessName,
			businessLocation,
			businessTypeId,
		} = data

		// Prisma handles the safety transaction internally via nested writes
		return prisma.user.update({
			where: { id: onboardingUser.id },
			data: {
				email,
				firstName,
				lastName,
				address,
				userType,
				businessName,
				businessTypeId,
				businessLocation,
				phone: onboardingUser.phone, // Use the phone number from the onboarding token
				onboardingStep: "PROFILE_COMPLETED",
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

	async updateLivenessStatus(userId: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				onboardingStep: "LIVENESS_PASSED",
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
				onboardingStep: "COMPLETED",
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
}
