import multer from "multer"

// import { BadRequestException } from "@/core/errors/exceptions";

const MAX_FILE_SIZE = 10 * 1024 * 1024

export const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_FILE_SIZE },
	// fileFilter: (_req, file, callback) => {
	// 	if (!file.mimetype.startsWith("/image")) {
	// 		callback(new BadRequestException("Only image upload is allowed"))
	// 	}
	// 	callback(null, true)
	// },
})

export const uploadSingleImage = upload.single("file")
