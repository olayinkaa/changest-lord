import "reflect-metadata"
import "dotenv/config"
import express from "express"
import helmet from "helmet"
import type { Container } from "inversify"
import { InversifyExpressServer } from "inversify-express-utils"
import pinoHttp from "pino-http"
import swaggerUi from "swagger-ui-express"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { isSwaggerEnabled, swaggerSpecPromise, swaggerUiOptions } from "@/config/swagger"
import { errorHandler } from "@/core/errors/error-handler"
import { Application } from "@/utils/application"
import { ADAPTER_TYPES } from "./adapters/adapters.types"
import type { IAwsRekognitionService } from "./adapters/aws-rekognition/aws-rekogniction.type"
import AppModules from "./app.module"
import { configureCors } from "./config/cors"
import { AwsCollectionId } from "./constants"
import { prisma } from "./core/database/db"
import { AuthProvider } from "./providers/auth-provider"

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

		try {
			const awsRekognitionService = this.container.get<IAwsRekognitionService>(
				ADAPTER_TYPES.AwsRekognitionService,
			)
			await awsRekognitionService.ensureCollectionExists(AwsCollectionId.USERS)
		} catch (error) {
			pinoLogger.error({ error }, "❌ Failed to initialize AWS Rekognition collection:")
		}

		// Load and dereference the OpenAPI spec once before the server builds,
		// so the synchronous `setConfig` callback below can mount Swagger UI.
		const swaggerSpec = await swaggerSpecPromise
		const server = new InversifyExpressServer(
			this.container,
			null, // Router
			{
				rootPath: "/api/v1",
			}, // path
			null, // app
			AuthProvider,
		)

		server.setConfig((app) => {
			app.use(express.json())
			app.use(configureCors())
			app.use(
				helmet({
					contentSecurityPolicy: false,
				}),
			)
			// Swagger UI is only rendered outside production (see src/config/swagger.ts).
			// The raw spec at /docs.json is also gated, so production builds have
			// no observable docs surface — set ENABLE_DOCS=true to override.
			if (isSwaggerEnabled || process.env.ENABLE_DOCS === "true") {
				app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))
				app.get("/docs.json", (_req, res) => res.json(swaggerSpec))
			}
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
