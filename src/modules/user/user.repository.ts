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
}
