import { type Job, Queue } from "bullmq"
import { inject, injectable } from "inversify"
import { type IRedisService, REDIS_TYPES } from "@/adapters/redis/redis.types"
import { pinoLogger } from "@/config/pino-logger"
import type {
	IQueueService,
	JobsOptions,
	QueueName,
	QueuePayloadMap,
} from "./queue.types"
import { TYPES } from "./queue.types"

@injectable()
export class QueueService implements IQueueService {
	private readonly queues = new Map<QueueName, Queue>()

	constructor(@inject(REDIS_TYPES.Service) private readonly redis: IRedisService) {}

	private getOrCreateQueue<K extends QueueName>(name: K): Queue<QueuePayloadMap[K]> {
		const existing = this.queues.get(name) as Queue<QueuePayloadMap[K]> | undefined
		if (existing) return existing
		const q = new Queue<QueuePayloadMap[K]>(name, {
			connection: this.redis.getClient(),
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: "exponential", delay: 30_000 },
				removeOnComplete: { count: 1_000, age: 24 * 60 * 60 },
				removeOnFail: { count: 5_000 },
			},
		})
		this.queues.set(name, q)
		return q
	}

	async publish<K extends QueueName>(
		name: K,
		data: QueuePayloadMap[K],
		opts?: JobsOptions,
	): Promise<Job<QueuePayloadMap[K]>> {
		const job = await this.getOrCreateQueue(name).add(name, data, opts)
		pinoLogger.info({ queue: name, jobId: job.id }, "Enqueued job")
		return job
	}

	async close(): Promise<void> {
		await Promise.all(Array.from(this.queues.values()).map((q) => q.close()))
		this.queues.clear()
	}
}

export { TYPES }
