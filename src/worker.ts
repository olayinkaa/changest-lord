import "reflect-metadata"
import "dotenv/config"
import type { Container } from "inversify"
import { type IRedisService, REDIS_TYPES } from "@/adapters/redis/redis.types"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { WorkerBootstrap } from "@/core/queue/worker.bootstrap"
import { WORKER_PROCESSOR_TAG, WorkerContainerModules } from "@/core/queue/worker.module"
import { Application } from "@/utils/application"

class WorkerApp extends Application {
	configureService(container: Container): void {
		container.load(...WorkerContainerModules)
	}

	async setup(): Promise<void> {
		const redis = this.container.get<IRedisService>(REDIS_TYPES.Service)
		try {
			const pong = await redis.ping()
			pinoLogger.info({ pong }, "Redis ping ok")
		} catch (err) {
			pinoLogger.fatal({ err }, "Redis ping failed at boot — exiting")
			process.exit(1)
		}

		const bootstrap = new WorkerBootstrap(this.container, redis, {
			processorTag: WORKER_PROCESSOR_TAG,
		})
		await bootstrap.start()

		const shutdown = async (signal: string) => {
			pinoLogger.info({ signal }, "Worker shutting down…")
			await bootstrap.stop()
			await redis.close()
			process.exit(0)
		}
		process.on("SIGTERM", () => void shutdown("SIGTERM"))
		process.on("SIGINT", () => void shutdown("SIGINT"))
	}
}

new WorkerApp({ defaultScope: "Singleton" })
pinoLogger.info(`⚙️ ${config.SERVICE_NAME} worker started on pid ${process.pid}`)
