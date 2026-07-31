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

	async createUserOnboarding(data: any) {
		const {
			email,
			firstName,
			lastName,
			address,
			userType,
			referralCode,
			businessName,
			businessLocation,
			businessType,
		} = data

		// 1. Handle BusinessType if seller

		// return user;
	}
}
