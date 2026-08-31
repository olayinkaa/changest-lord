import type { Job, Queue } from "bullmq"
import { inject, injectable } from "inversify"
import { BULLMQ_TYPES, type IBullMQQueueService } from "@/adapters/bullmq/types"
import { pinoLogger } from "@/config/pino-logger"
import type {
	IQueueService,
	JobsOptions,
	QueueName,
	QueuePayloadMap,
} from "./queue.types"
import { TYPES } from "./queue.types" // Make sure QUEUE_NAMES is imported
import { QUEUE_NAMES } from "./queue-name"

@injectable()
export class QueueService implements IQueueService {
	private readonly queues = new Map<QueueName, Queue>()

	constructor(
		@inject(BULLMQ_TYPES.QueueService)
		private readonly bullmqService: IBullMQQueueService,
	) {
		// 💡 Pre-initialize all queues on startup so QueueDash sees them right away
		for (const name of Object.values(QUEUE_NAMES)) {
			this.getOrCreateQueue(name as QueueName)
		}
	}

	private getOrCreateQueue<K extends QueueName>(name: K): Queue<QueuePayloadMap[K]> {
		const existing = this.queues.get(name) as Queue<QueuePayloadMap[K]> | undefined
		if (existing) return existing

		const q = this.bullmqService.getQueue(name, {
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: "exponential", delay: 30_000 },
				removeOnComplete: { count: 1_000, age: 24 * 60 * 60 },
				removeOnFail: { count: 5_000 },
			},
		}) as Queue<QueuePayloadMap[K]>

		this.queues.set(name, q)
		return q
	}

	async publish<K extends QueueName>(
		name: K,
		data: QueuePayloadMap[K],
		opts?: JobsOptions,
	): Promise<Job<QueuePayloadMap[K]>> {
		const job = await this.getOrCreateQueue(name).add(name as any, data as any, opts)
		pinoLogger.info({ queue: name, jobId: job.id }, "Enqueued job")
		return job
	}

	getQueues(): Queue[] {
		return Array.from(this.queues.values())
	}

	async close(): Promise<void> {
		await Promise.all(Array.from(this.queues.values()).map((q) => q.close()))
		this.queues.clear()
	}
}

export { TYPES }
