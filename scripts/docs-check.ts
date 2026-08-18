/**
 * OpenAPI spec linter — loads src/docs/openapi.yaml, validates every $ref
 * resolves, and exits non-zero on any failure. Wire this up in CI so a
 * malformed YAML edit (or a typo in a $ref) breaks the build before it
 * lands.
 *
 * Usage: `pnpm run docs:check`
 */

import path from "node:path"
import process from "node:process"
import SwaggerParser from "@apidevtools/swagger-parser"

const SPEC_PATH = path.resolve(process.cwd(), "src/docs/openapi.yaml")

async function main() {
	try {
		const api = await SwaggerParser.validate(SPEC_PATH)
		const pathKeys = Object.keys((api as { paths?: Record<string, unknown> }).paths ?? {})
		const schemaKeys = Object.keys(
			(api as { components?: { schemas?: Record<string, unknown> } }).components
				?.schemas ?? {},
		)
		console.log(
			`[docs:check] OK — ${pathKeys.length} paths, ${schemaKeys.length} schemas`,
		)
		console.log("  paths:  ", pathKeys.join(", ") || "(none)")
		console.log("  schemas:", schemaKeys.join(", ") || "(none)")
		process.exit(0)
	} catch (error) {
		console.error("[docs:check] FAILED")
		console.error(error instanceof Error ? error.message : error)
		process.exit(1)
	}
}

main()
