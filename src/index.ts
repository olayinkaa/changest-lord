import "reflect-metadata"
import express from "express"
import helmet from "helmet"
import type { Container } from "inversify"
import { InversifyExpressServer } from "inversify-express-utils"
import pinoHttp from "pino-http"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { errorHandler } from "@/core/errors/error-handler"
import { Application } from "@/utils/application"
import AppModules from "./app.module"
import { configureCors } from "./config/cors"
import { prisma } from "./core/database/db"

export class App extends Application {
	configureService(container: Container): void {
		container.load(...AppModules)
	}

	async setup() {
		try {
			await prisma.$connect()
			pinoLogger.info("✅ Database connected")
		} catch (error) {
			pinoLogger.error({ error }, "❌ Database connection failed:")
			process.exit(1)
		}
		const server = new InversifyExpressServer(
			this.container,
			null, // Router
			{
				rootPath: "/api/v1",
			},
		)

		server.setConfig((app) => {
			app.use(express.json())
			app.use(configureCors())
			app.use(
				helmet({
					contentSecurityPolicy: false,
				}),
			)
			//   app.use((req, res, next) => {
			//     RequestLogger.handler(req, res, next);
			//   });
			app.use(pinoHttp({ logger: pinoLogger }))
		})

		server.setErrorConfig((app) => {
			app.use(errorHandler)
		})

		const app = server.build()

		const serverInstance = app.listen(config.SERVICE_PORT, () => {
			pinoLogger.info(
				`🛜 ${config.SERVICE_NAME} is running on http://localhost:${config.SERVICE_PORT}`,
			)
		})

		serverInstance.timeout = 0

		const handleShutdown = async (signal: string) => {
			pinoLogger.info(`${signal} received, shutting down gracefully...`)

			serverInstance.close(() => process.exit(0))
		}

		//
		// ─── Graceful shutdown ───────────────────────────────────
		process.on("SIGTERM", async () => {
			handleShutdown("SIGTERM")
		})

		process.on("SIGINT", async () => {
			handleShutdown("SIGINT")
		})
	}
}

async function bootstrap() {
	new App({ defaultScope: "Singleton" })
}

bootstrap()
