import type { Container } from "inversify"
import { type IRedisService, REDIS_TYPES } from "@/adapters/redis/redis.types"
import { pinoLogger } from "@/config/pino-logger"
import { WORKER_PROCESSOR_TAG, WorkerBootstrap } from "./worker.bootstrap"

export class WorkerManager {
	private bootstrap?: WorkerBootstrap
	private redis?: IRedisService

	async start(container: Container): Promise<void> {
		this.redis = container.get<IRedisService>(REDIS_TYPES.Service)

		try {
			const pong = await this.redis.ping()
			pinoLogger.info({ pong }, "Redis ping ok")
		} catch (err) {
			pinoLogger.error({ err }, "Redis ping failed during worker startup")
			throw err
		}

		this.bootstrap = new WorkerBootstrap(container, this.redis, {
			processorTag: WORKER_PROCESSOR_TAG,
		})

		await this.bootstrap.start()
		pinoLogger.info(`⚙️ Worker processes started on pid ${process.pid}`)
	}

	async stop(): Promise<void> {
		if (this.bootstrap) {
			await this.bootstrap.stop()
		}
		if (this.redis) {
			await this.redis.close()
		}
		pinoLogger.info("Worker manager stopped")
	}
}
