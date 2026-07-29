import { Readable } from "node:stream"
import type { UploadApiResponse } from "cloudinary"
import { v2 as Cloudinary, type ConfigOptions } from "cloudinary"
import { pinoLogger } from "@/config/pino-logger"
import type { ICloudinaryService } from "./cloudinary.contract"

export class CloudinaryService implements ICloudinaryService {
	private readonly cloudinary: typeof Cloudinary
	constructor(config: ConfigOptions) {
		this.cloudinary = Cloudinary
		this.cloudinary.config({ ...config, secure: true })
	}

	upload(buffer: Buffer, folder = "events"): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const uploadStream = this.cloudinary.uploader.upload_stream(
				{ folder, resource_type: "auto" },
				(error, result) => {
					if (error) return reject(error)
					resolve(result as UploadApiResponse)
				},
			)

			Readable.from(buffer).pipe(uploadStream)
		})
	}

	async destroy(publicId: string) {
		try {
			return await this.cloudinary.uploader.destroy(publicId)
		} catch (err) {
			pinoLogger.error({ err }, "Cloudinary delete error")
			throw err
		}
	}
}
