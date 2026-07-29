import type { ZodObject, ZodRawShape } from "zod"
import { z } from "zod"

interface EnvOptions {
	source?: NodeJS.ProcessEnv
	serviceName?: string
}

type SchemaOutput<TSchema extends ZodRawShape> = ZodObject<TSchema>["_output"]

export const createEnv = <TSchema extends ZodRawShape>(
	schema: ZodObject<TSchema>,
	options: EnvOptions = {},
): SchemaOutput<TSchema> => {
	const { source = process.env, serviceName = "service" } = options

	const parsed = schema.safeParse(source)

	if (!parsed.success) {
		// 1. Recommended: Use z.treeifyError for structured nested errors
		// const formattedErrors = z.treeifyError(parsed.error);
		const formattedErrors = z.flattenError(parsed.error)

		// 2. Alternative: Use z.prettifyError for a human-readable string
		const prettyMessage = z.prettifyError(parsed.error)

		throw new Error(
			`[${serviceName}] Environment variable validation failed:\n${prettyMessage}\nDetails: ${JSON.stringify(formattedErrors.fieldErrors)}`,
		)
	}

	return parsed.data
}

export type EnvSchema<TShape extends ZodRawShape> = ZodObject<TShape>
