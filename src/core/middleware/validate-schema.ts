import { plainToInstance } from "class-transformer"
import { validate } from "class-validator"
import { withMiddleware } from "inversify-express-utils"

export function validateSchema<T>(dtoClass: new () => T) {
	return withMiddleware(async (req, res, next) => {
		const dtoInstance: any = plainToInstance(dtoClass, req.body, {
			enableImplicitConversion: true, // 🔁 Auto-convert types
			exposeDefaultValues: true, // 🎯 Use default values from DTO
		})

		const errors = await validate(dtoInstance, {
			whitelist: true,
			forbidNonWhitelisted: true,
			skipMissingProperties: false,
		})

		if (errors.length > 0) {
			const formattedErrors: Record<string, string> = {}

			errors.forEach((err) => {
				const constraints = err.constraints
				if (constraints && err.property && typeof err.property === "string") {
					const firstMessage = Object.values(constraints)[0] ?? "Validation error"
					formattedErrors[err.property] = firstMessage
				}
			})

			return res.status(400).json({
				success: false,
				statusCode: 400,
				message: "Validation failed",
				errors: formattedErrors,
			})
		}

		req.body = dtoInstance
		next()
	})
}
