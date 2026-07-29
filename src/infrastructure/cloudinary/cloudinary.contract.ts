import type { UploadApiResponse } from "cloudinary"

export interface ICloudinaryService {
	upload(buffer: Buffer, folder?: string): Promise<UploadApiResponse>
	destroy(publicId: string): Promise<any>
}
