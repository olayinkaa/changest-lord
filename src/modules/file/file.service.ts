import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { ICloudinaryService } from "@/adapters/cloudinary/cloudinary.types"
import { pinoLogger } from "@/config/pino-logger"
import type { Image } from "@/generated/prisma/client"
import { FILE_TYPES, type IFileRepository, type IFileService } from "./file.types"

@injectable()
export class FileService implements IFileService {
	constructor(
		@inject(ADAPTER_TYPES.CloudinaryService)
		private readonly cloudinary: ICloudinaryService,
		@inject(FILE_TYPES.Repository)
		private readonly fileRepository: IFileRepository,
	) {}

	async uploadImage(file: Express.Multer.File): Promise<Image | any> {
		// 1. Upload to Cloudinary
		try {
			const result = await this.cloudinary.upload(file.buffer, "general")

			// 2. Save metadata to the database via repository
			const savedImage = await this.fileRepository.createImage({
				publicId: result.public_id,
				url: result.url,
				secureUrl: result.secure_url,
				format: result.format,
				bytes: result.bytes,
				folder: "general",
			})

			return savedImage
		} catch (error) {
			pinoLogger.error({ error }, "Failed to upload file")
			throw error
		}
	}

	async getAllImages(): Promise<Image[]> {
		return this.fileRepository.getAllImageFiles()
	}

	async deleteImage(id: string): Promise<void> {
		const image = await this.fileRepository.getImageById(id)
		if (!image) {
			throw new Error("Image not found")
		}

		try {
			await this.cloudinary.destroy(image.publicId)
			await this.fileRepository.deleteImage(id)
		} catch (error) {
			pinoLogger.error({ error }, "Failed to delete image")
			throw error
		}
	}
}
