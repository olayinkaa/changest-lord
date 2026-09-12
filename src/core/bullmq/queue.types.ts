import type { Job, JobsOptions, QueueOptions, WorkerOptions } from "bullmq"
import type { Redis } from "ioredis"
import type { CloudinaryJobPayload, EmailJobPayload } from "./payloads"
import { QUEUE_NAMES } from "./queue-name"

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export type QueuePayloadMap = {
	[QUEUE_NAMES.Email]: EmailJobPayload
	[QUEUE_NAMES.Cloudinary]: CloudinaryJobPayload
	[QUEUE_NAMES.Settlement]: any
	[QUEUE_NAMES.BankTransfer]: {
		reference: string
		accountNumber: string
		bankCode: string
		amount: string
	}
	[QUEUE_NAMES.Webhook]: {
		logId: string
		payload: any
	}
}

export interface IQueueService {
	publish<K extends QueueName>(name: K, data: QueuePayloadMap[K], opts?: JobsOptions): Promise<Job<QueuePayloadMap[K]>>
	close(): Promise<void>
}

export interface IBaseProcessor {
	readonly queueName: QueueName
	start(redis: Redis): Promise<void>
	stop(): Promise<void>
}

export const QUEUE_TYPES = {
	QueueService: Symbol.for("QueueService"),
	WorkerProcessor: Symbol.for("WorkerProcessor"),
} as const

export type { JobsOptions, QueueOptions, WorkerOptions }
