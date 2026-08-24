import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { IKycRepository } from "./kyc.types"

@injectable()
export class KycRepository implements IKycRepository {
	async getAllCachedBvns() {
		return prisma.bvnCache.findMany({
			orderBy: { createdAt: "desc" },
		})
	}

	async findCachedBvnByID(id: string) {
		return prisma.bvnCache.findUnique({
			where: { id },
		})
	}

	async findBvnRecordLocally(bvn: string) {
		return prisma.bvnCache.findUnique({
			where: { bvn },
		})
	}

	async saveBvnRecordLocally(data: {
		bvn: string
		firstName?: string
		lastName?: string
		dob?: string
		phone?: string
		image?: string
	}) {
		return prisma.bvnCache.create({
			data,
		})
	}
}
