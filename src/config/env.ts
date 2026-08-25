import z from "zod"
import { constants } from "@/constants"
import { createEnv } from "@/utils/env"

const envSchema = z
	.object({
		// Core service configuration
		API_URL: z.string().default("https://changest-lord-1.onrender.com/api/v1"),
		SERVICE_PORT: z.coerce
			.number()
			.int()
			.min(0)
			.max(8000)
			.default(constants.SERVICE_PORT),
		NODE_ENV: z.enum(["development", "production", "staging"]).default("development"),
		APP_ENV: z
			.enum(["development", "production", "staging"])
			.optional()
			.default("development"),
		SERVICE_NAME: z.string().default("myChange-Service"),
		DATABASE_URL: z.string(),
		LOG_LEVEL: z
			.enum(["trace", "debug", "info", "warn", "error", "fatal"])
			.default("info"),

		// JWT configuration
		JWT_TOKEN_SECRET: z.string().min(32),
		JWT_ONBOARDING_SECRET: z.string().min(32),
		JWT_REFRESH_TOKEN_SECRET: z.string().min(32),
		JWT_TOKEN_EXPIRES_IN: z.string().default(constants.TOKEN_EXPIRES_IN),
		JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default(constants.REFRESH_TOKEN_EXPIRES_IN),
		// Google configuration
		GOOGLE_MAPS_API_KEY: z.string(),
		// Redis configuration
		// Aws configuration
		AWS_ACCESS_KEY_ID: z.string(),
		AWS_SECRET_ACCESS_KEY: z.string(),
		AWS_REKOGNITION_REGION: z.string().default("eu-west-1"),
		// Email configuration
		// Verification configuration
		VERIFCATION_PROVIDER: z.enum(["dojah", "youverify"]).default("dojah"),
		DOJAH_API_URL: z.string().optional(),
		DOJAH_APP_ID: z.string().optional(),
		DOJAH_API_KEY: z.string().optional(),
		// Other configuration
	})
	.superRefine((data, ctx) => {
		// -----------------------------------------------------------------
		// 1. Verification Provider Requirements Check (Scalable Map)
		// -----------------------------------------------------------------
		const providerRequirements: Record<string, string[]> = {
			dojah: ["DOJAH_API_URL", "DOJAH_APP_ID", "DOJAH_API_KEY"],
			youverify: ["YOUVERIFY_API_KEY"],
		}
		const currentProvider = data.VERIFCATION_PROVIDER
		const requiredFields = providerRequirements[currentProvider] || []
		for (const field of requiredFields) {
			if (!data[field as keyof typeof data]) {
				ctx.addIssue({
					code: "custom",
					message: `${field} is required when VERIFCATION_PROVIDER is '${currentProvider}'`,
					path: [field],
				})
			}
		}
		// -----------------------------------------------------------------
		// 2. Additional goes below
		// -----------------------------------------------------------------
	})

type EnvType = z.infer<typeof envSchema>

export const config: EnvType = createEnv(envSchema, {
	serviceName: "myChange-service",
})

export type Env = typeof config
