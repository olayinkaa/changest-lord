import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { IOnboardingRepository } from "./onboarding.types"

@injectable()
export class OnboardingRepository implements IOnboardingRepository {
	async findUserByPhone(phone: string) {
		return prisma.user.findUnique({
			where: { phone },
		})
	}

	async createUserWithKyc(data: any) {
		return prisma.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: {
					phone: data.phone,
					email: data.email,
					firstName: data.firstName,
					lastName: data.lastName,
					address: data.address,
				},
			})

			await tx.userKyc.create({
				data: {
					userId: user.id,
				},
			})

			return user
		})
	}

	async updateUserDetails(userId: string, data: any) {
		return prisma.user.update({
			where: { id: userId },
			data,
		})
	}

	async updateUserRole(userId: string, role: string) {
		return prisma.user.update({
			where: { id: userId },
			data: { role },
		})
	}

	async updateSellerDetails(userId: string, data: any) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				businessName: data.businessName,
				address: data.address,
				latitude: data.latitude,
				longitude: data.longitude,
			},
		})
	}

	async updateSecurityInfo(userId: string, pinHash: string, userId5: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				pinHash,
				userId5,
			},
		})
	}

	async updateKycStatus(userId: string, status: any) {
		return prisma.userKyc.update({
			where: { userId },
			data: status,
		})
	}

	async bindDevice(userId: string, deviceData: any) {
		return prisma.userDevice.create({
			data: {
				userId,
				deviceId: deviceData.deviceId,
				deviceToken: deviceData.deviceToken,
			},
		})
	}
}
