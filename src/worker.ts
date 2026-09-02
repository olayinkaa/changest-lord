import "reflect-metadata"
import "dotenv/config"
import type { Container } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { WorkerContainerModules } from "@/core/queue/worker.module"
import { WorkerManager } from "@/core/queue/worker-manager"
import { Application } from "@/utils/application"

class WorkerApp extends Application {
	configureService(container: Container): void {
		container.load(...WorkerContainerModules)
	}

	async setup(): Promise<void> {
		const workerManager = new WorkerManager()
		try {
			await workerManager.start(this.container)
		} catch (err) {
			pinoLogger.fatal({ err }, "Worker failed to start — exiting")
			process.exit(1)
		}

		const shutdown = async (signal: string) => {
			pinoLogger.info({ signal }, "Worker shutting down…")
			await workerManager.stop()
			process.exit(0)
		}
		process.on("SIGTERM", () => void shutdown("SIGTERM"))
		process.on("SIGINT", () => void shutdown("SIGINT"))
	}
}

const app = new WorkerApp({ defaultScope: "Singleton" })
pinoLogger.info(`⚙️ ${config.SERVICE_NAME} worker started on pid ${process.pid}`)
