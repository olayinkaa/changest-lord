import z from "zod"
import { constants } from "@/constants"
import { createEnv } from "@/utils/env"

const envSchema = z.object({
	// Core service configuration
	SERVICE_PORT: z.coerce.number().int().min(0).max(8000).default(constants.SERVICE_PORT),
	NODE_ENV: z.enum(["development", "production", "staging"]).default("development"),
	SERVICE_NAME: z.string().default("myChange-Service"),
	DATABASE_URL: z.string(),
	LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

	// JWT configuration
	JWT_TOKEN_SECRET: z.string().min(32),
	JWT_TOKEN_EXPIRES_IN: z.string().default(constants.TOKEN_EXPIRES_IN),
	// Google configuration
	GOOGLE_MAPS_API_KEY: z.string(),
	// Redis configuration
	// Aws configuration
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
	AWS_REKOGNITION_REGION: z.string().default("us-east-1"),
	// Email configuration
	// Other configuration
})

type EnvType = z.infer<typeof envSchema>

export const config: EnvType = createEnv(envSchema, {
	serviceName: "myChange-service",
})

export type Env = typeof config
