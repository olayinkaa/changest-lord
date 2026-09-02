import type { NextFunction, Request } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpDelete,
	httpPost,
	next,
	request,
	requestParam,
} from "inversify-express-utils"
import { upload } from "@/adapters/cloudinary/multer"
import { BadRequestException } from "@/core/errors/exceptions"
import { ApiResponse } from "@/utils/http-response"
import { FILE_TYPES, type IFileService } from "./file.types"

@controller("/file")
export class FileController extends BaseHttpController {
	constructor(@inject(FILE_TYPES.Service) private readonly fileService: IFileService) {
		super()
	}

	@httpPost("/image", upload.single("imageFile"))
	public async uploadImage(@request() req: Request, @next() nxt: NextFunction) {
		try {
			if (!req.file) {
				throw new BadRequestException("Image file is required")
			}
			const result = await this.fileService.uploadImage(req.file)
			return this.json(ApiResponse.success(result), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpDelete("/:id")
	public async deleteImage(@requestParam("id") id: number, @next() nxt: NextFunction) {
		try {
			await this.fileService.deleteImage(id)
			return this.json(
				ApiResponse.success({ message: "Image deleted successfully" }),
				200,
			)
		} catch (error) {
			nxt(error)
		}
	}
}
