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

	async createUserOnboarding(data: any) {
		const {
			email,
			phone,
			firstName,
			lastName,
			address,
			userType,
			businessName,
			businessLocation,
			businessTypeId,
		} = data

		// Prisma handles the safety transaction internally via nested writes
		return prisma.user.create({
			data: {
				email,
				phone,
				firstName,
				lastName,
				address,
				userType,
				businessName,
				businessTypeId,
				businessLocation,
				// Direct nested creation
				kyc: {
					create: {
						completedProfile: true,
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

	async updateUserPin(userId: string, pinHash: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				pinHash,
				kyc: {
					create: {
						pinCreated: true,
					},
				},
			},
		})
	}

	async updateKycPinStatus(userId: string, pinCreated: boolean) {
		return prisma.userKyc.update({
			where: { userId },
			data: { pinCreated },
		})
	}

	async findUserByPhone(phone: string) {
		return prisma.user.findUnique({
			where: { phone },
		})
	}
}
