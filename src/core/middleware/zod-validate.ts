import type { NextFunction, Request, Response } from "express"
import { withMiddleware } from "inversify-express-utils"
import { ZodError, type ZodType } from "zod"

export function validateZodSchema<T>(schema: ZodType<T>) {
	return withMiddleware(async (req: Request, res: Response, next: NextFunction) => {
		try {
			// parse and strip unknown properties (equivalent to whitelist: true)
			const parsedBody = await schema.parseAsync(req.body)

			// Re-assign the validated/transformed body back to req.body
			req.body = parsedBody
			next()
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors: Record<string, string> = {}
				// Map Zod errors to field-level messages
				error.issues.forEach((issue) => {
					const path = issue.path.join(".")
					if (path) {
						formattedErrors[path] = issue.message
					}
				})

				return res.status(400).json({
					success: false,
					statusCode: 400,
					message: "Validation failed",
					errors: formattedErrors,
				})
			}

			return res.status(400).json({
				success: false,
				statusCode: 400,
				message: "Validation failed",
				errors: { general: "Invalid request body" },
			})
		}
	})
}
