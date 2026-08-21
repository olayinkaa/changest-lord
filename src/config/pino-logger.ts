import { ContainerModule, type interfaces } from "inversify"
import pino from "pino"
import { TYPES } from "@/types/di-types"
import { config } from "./env"

// Only use pino-pretty transport locally
const isDev = config.NODE_ENV === "development"

export const pinoLogger = pino(
	{
		level: process.env.LOG_LEVEL ?? "info",
		serializers: {
			err: pino.stdSerializers.err,
			error: pino.stdSerializers.err,
		},
		base: { app: config.SERVICE_NAME, env: config.NODE_ENV },
		timestamp: pino.stdTimeFunctions.isoTime,
		redact: {
			paths: ["req.headers.authorization", "password", "pin"],
			censor: "****REDACTED****",
		},
	},
	// Pass transport ONLY if in development, otherwise omit it to log straight to stdout
	isDev
		? pino.transport({
				targets: [{ target: "pino-pretty", options: { colorize: true } }],
			})
		: undefined,
)

export const LoggerModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<pino.Logger>(TYPES.Logger)
		.toDynamicValue(() => {
			return pinoLogger.child({
				requestId: crypto.randomUUID(),
			})
		})
		.inRequestScope()
})
