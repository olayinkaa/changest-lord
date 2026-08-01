import { plainToInstance } from "class-transformer"
import { validate } from "class-validator"

export function validateQuery(dtoClass: any) {
	return async (req: any, res: any, next: any) => {
		const output = plainToInstance(dtoClass, req.query)
		const errors = await validate(output)

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				statusCode: 400,
				message: "Validation failed",
				errors: errors.flatMap((e) => Object.values(e.constraints || {})),
			})
		}

		// Re-assign the transformed (typed) instance to req.query
		req.query = output
		next()
	}
}
