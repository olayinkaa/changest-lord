import type { Image } from "@/generated/prisma/client"

export const FILE_TYPES = {
	Service: Symbol.for("FileService"),
	Repository: Symbol.for("FileRepository"),
}

export interface IFileService {
	uploadImage(file: Express.Multer.File): Promise<any>
	getAllImages(): Promise<Image[]>
	deleteImage(id: number): Promise<void>
}

export interface IFileRepository {
	getAllImageFiles(): Promise<Image[]>
	getImageById(id: number): Promise<Image | null>
	createImage(data: {
		publicId: string
		url: string
		secureUrl: string
		format: string
		bytes: number
		folder: string
	}): Promise<any>
	deleteImage(id: number): Promise<void>
}
