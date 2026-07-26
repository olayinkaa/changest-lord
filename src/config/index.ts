import z from "zod";
import { createEnv } from "@/utils/env";
import { constants } from "@/constants";

const envSchema = z.object({
  // Core service configuration
  SERVICE_PORT: z.coerce
    .number()
    .int()
    .min(0)
    .max(8000)
    .default(constants.SERVICE_PORT),
  SERVICE_NAME: z.string().default("myChange-service"),

  // JWT configuration
  JWT_TOKEN_SECRET: z.string().min(32),
  JWT_TOKEN_EXPIRES_IN: z.string().default(constants.TOKEN_EXPIRES_IN),
  // Redis configuration
  // Email configuration
  // Other configuration
});

type EnvType = z.infer<typeof envSchema>;

export const config: EnvType = createEnv(envSchema, {
  serviceName: "myChange-service",
});

export type Env = typeof config;
