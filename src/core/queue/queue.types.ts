import type { Job, JobsOptions, QueueOptions, WorkerOptions } from "bullmq"
import type { Redis } from "ioredis"

export const QUEUE_NAMES = {
	Email: "email",
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export type EmailJobPayload = {
	to: string
	subject: string
	htmlBody?: string
	textBody?: string
	fromEmail?: string
}

export type QueuePayloadMap = {
	[QUEUE_NAMES.Email]: EmailJobPayload
}

export interface IQueueService {
	publish<K extends QueueName>(
		name: K,
		data: QueuePayloadMap[K],
		opts?: JobsOptions,
	): Promise<Job<QueuePayloadMap[K]>>
	close(): Promise<void>
}

export interface IBaseProcessor {
	readonly queueName: QueueName
	start(redis: Redis): Promise<void>
	stop(): Promise<void>
}

export const TYPES = {
	QueueService: Symbol.for("QueueService"),
} as const

export type { JobsOptions, QueueOptions, WorkerOptions }
