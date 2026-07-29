/// <reference types="node" />

import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

dotenv.config()
// dotenv.config({ path: ".env.local" })

export default defineConfig({
	// schema: "prisma/schema.prisma",
	schema: "prisma/",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx prisma/seed.ts",
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
})
