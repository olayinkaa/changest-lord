import { type Job, Worker } from "bullmq"
import type { Redis } from "ioredis"
import { pinoLogger } from "@/config/pino-logger"
import type { IBaseProcessor, QueueName, QueuePayloadMap } from "./queue.types"

export abstract class BaseProcessor<K extends QueueName = QueueName>
	implements IBaseProcessor
{
	public abstract readonly queueName: K
	protected worker: Worker<QueuePayloadMap[K]> | null = null
	protected abstract readonly concurrency: number
	protected abstract readonly rateLimit?: { max: number; duration: number }

	protected abstract handle(
		data: QueuePayloadMap[K],
		job: Job<QueuePayloadMap[K]>,
	): Promise<void>

	public async start(redis: Redis): Promise<void> {
		this.worker = new Worker<QueuePayloadMap[K]>(
			this.queueName,
			async (job) => this.handle(job.data, job),
			{
				connection: redis as any,
				concurrency: this.concurrency,
				...(this.rateLimit && { limiter: this.rateLimit }),
			},
		)
		this.worker.on("completed", (job) =>
			pinoLogger.info(
				{
					queue: this.queueName,
					jobId: job.id,
					attempts: job.attemptsMade + 1,
				},
				"Job completed",
			),
		)
		this.worker.on("failed", (job, err) =>
			pinoLogger.error(
				{
					queue: this.queueName,
					jobId: job?.id,
					attempts: job?.attemptsMade,
					err,
				},
				"Job failed",
			),
		)
		pinoLogger.info(
			{ queue: this.queueName, concurrency: this.concurrency },
			"Worker started",
		)
	}

	public async stop(): Promise<void> {
		if (this.worker) {
			await this.worker.close()
			this.worker = null
		}
	}
}
