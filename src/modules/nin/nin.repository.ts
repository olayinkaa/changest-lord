import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { INinRepository } from "./nin.types"

@injectable()
export class NinRepository implements INinRepository {
	async getAllCachedNins() {
		return prisma.ninCache.findMany({
			orderBy: { createdAt: "desc" },
		})
	}

	async findCachedNinByID(id: string) {
		return prisma.ninCache.findUnique({
			where: { id },
		})
	}

	async findNinRecordLocally(nin: string) {
		return prisma.ninCache.findUnique({
			where: { nin },
		})
	}

	async saveNinRecordLocally(data: {
		nin: string
		firstName?: string
		lastName?: string
		dob?: string
		phone?: string
		image?: string
	}) {
		return prisma.ninCache.create({
			data,
		})
	}
}
