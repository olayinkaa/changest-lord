import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { IFileRepository } from "./file.types"

@injectable()
export class FileRepository implements IFileRepository {
	async getAllImageFiles() {
		return prisma.image.findMany({
			orderBy: {
				createdAt: "desc", // Returns the newest images first
			},
		})
	}

	async getImageById(id: string) {
		return prisma.image.findUnique({
			where: { id },
		})
	}

	async createImage(data: {
		publicId: string
		url: string
		secureUrl: string
		format: string
		bytes: number
		folder: string
	}) {
		return prisma.image.create({
			data: {
				publicId: data.publicId,
				url: data.url,
				secureUrl: data.secureUrl,
				format: data.format,
				bytes: data.bytes,
				folder: data.folder,
			},
		})
	}

	async deleteImage(id: string) {
		await prisma.image.delete({
			where: { id },
		})
	}
}
