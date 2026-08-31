import type { Queue, QueueOptions } from "bullmq"

export const BULLMQ_TYPES = {
	QueueService: Symbol.for("BullMQQueueService"),
} as const

export interface IBullMQQueueService {
	getQueue(queueName: string, options?: Partial<QueueOptions>): Queue
	addJob<T>(queueName: string, name: string, data: T, options?: any): Promise<any>
}
