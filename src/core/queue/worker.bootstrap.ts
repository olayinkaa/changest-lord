import type { Container } from "inversify"
import type { Redis } from "ioredis"
import { type IRedisService, REDIS_TYPES } from "@/adapters/redis/redis.types"
import { pinoLogger } from "@/config/pino-logger"
import type { IBaseProcessor } from "./queue.types"

export const WORKER_PROCESSOR_TAG = Symbol.for("WorkerProcessor")

export interface WorkerBootstrapOptions {
	processorTag: symbol
}

export class WorkerBootstrap {
	private workers: IBaseProcessor[] = []
	private started = false

	constructor(
		private readonly container: Container,
		private readonly redis: IRedisService,
		private readonly opts: WorkerBootstrapOptions,
	) {}

	async start(): Promise<void> {
		if (this.started) return
		this.workers = this.container.getAll<IBaseProcessor>(this.opts.processorTag)
		const client: Redis = this.redis.getClient()
		await Promise.all(this.workers.map((w) => w.start(client)))
		this.started = true
	}

	async stop(): Promise<void> {
		if (!this.started) return
		await Promise.all(this.workers.map((w) => w.stop()))
		this.workers = []
		this.started = false
		pinoLogger.info("Worker bootstrap stopped")
	}
}

export { REDIS_TYPES }
