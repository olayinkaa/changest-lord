import path from "node:path"
import SwaggerParser from "@apidevtools/swagger-parser"
import type { OpenAPI } from "openapi-types"
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes"
import type { SwaggerUiOptions } from "swagger-ui-express"
import { config } from "@/config/env"

// Root spec lives at src/docs/openapi.yaml and pulls in sibling module files
// via standard OpenAPI $ref. Resolved on first call via @apidevtools/swagger-parser,
// which dereferences every $ref so the served spec is one inlined document.
const SPEC_PATH = path.resolve(process.cwd(), "src/docs/openapi.yaml")

// const SWAGGER_ENABLED = config.NODE_ENV !== "production"
const SWAGGER_ENABLED = true
const theme = new SwaggerTheme()

/**
 * Bundled OpenAPI 3.1 spec with every $ref resolved.
 * Loaded once on first access — failures fall back to an empty spec so a
 * malformed YAML edit never crashes the boot path.
 */
const specPromise: Promise<OpenAPI.Document> = SwaggerParser.validate(SPEC_PATH)
	.then((parsed) => {
		const api = parsed as OpenAPI.Document
		// Override the static `servers` block with the current runtime port so
		// the "Try it out" button always points at this process.
		return {
			...api,
			servers: [
				{
					url: `http://localhost:${config.SERVICE_PORT}/api/v1`,
					description: `${config.NODE_ENV} server`,
				},
			],
		}
	})
	.catch((error: unknown) => {
		// eslint-disable-next-line no-console
		console.error("[swagger] failed to load OpenAPI spec:", error)
		return {
			openapi: "3.0.3",
			info: { title: "unavailable", version: "0" },
			paths: {},
		} as OpenAPI.Document
	})

export const swaggerSpecPromise = specPromise

export const swaggerUiOptions: SwaggerUiOptions = {
	explorer: true,
	customSiteTitle: `${config.SERVICE_NAME} API Docs`,
	customCss: theme.getBuffer(SwaggerThemeNameEnum.MATERIAL),
	swaggerOptions: {
		persistAuthorization: true,
		displayRequestDuration: true,
		docExpansion: "list",
		filter: true,
		tryItOutEnabled: true,
	},
}

export const isSwaggerEnabled = SWAGGER_ENABLED
