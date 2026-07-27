import { Catch, type HttpExceptionFilter } from "@inversifyjs/http-core"
import { ValidationError } from "@inversifyjs/standard-schema-validation"
import type { Response } from "express"

@Catch(ValidationError)
export class ZodValidationErrorFilter implements HttpExceptionFilter<ValidationError> {
	catch(error: ValidationError, response: Response) {
		const errors: Record<string, string> = {}

		for (const issue of error.cause.issues) {
			const field = issue.path.join(".")

			errors[field || "root"] = issue.message
		}

		return response.status(400).json({
			message: "Validation failed",
			errors,
		})
	}
}
