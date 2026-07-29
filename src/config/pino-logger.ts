import { ContainerModule, type interfaces } from "inversify"
import pino from "pino"
import { TYPES } from "@/types/di-types"
import { config } from "./env"

// console.log("NODE_ENV is:", process.env.NODE_ENV);

const getTransports = () => {
	const targets = []
	if (config.NODE_ENV === "development") {
		targets.push({ target: "pino-pretty", options: { colorize: true } })
	}
	// Simplified: Add New Relic target here if needed
	return pino.transport({ targets })
}

export const pinoLogger = pino(
	{
		level: process.env.LOG_LEVEL ?? "info",
		serializers: {
			err: pino.stdSerializers.err,
			error: pino.stdSerializers.err,
		},
		base: { app: config.SERVICE_NAME, env: process.env.NODE_ENV },
		timestamp: pino.stdTimeFunctions.isoTime,
		redact: {
			paths: ["req.headers.authorization", "password", "pin"],
			censor: "****REDACTED****",
		},
	},
	getTransports(),
)

export const LoggerModule = new ContainerModule((bind: interfaces.Bind) => {
	// Generates an isolated, request-tagged child logger for every unique incoming API call
	bind<pino.Logger>(TYPES.Logger)
		.toDynamicValue(() => {
			return pinoLogger.child({
				requestId: crypto.randomUUID(),
			})
		})
		.inRequestScope()
})
