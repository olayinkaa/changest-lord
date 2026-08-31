import { type Job, Queue, type QueueOptions } from "bullmq"
import { inject, injectable } from "inversify"
import type { IRedisService } from "@/adapters/redis/redis.types"
import { REDIS_TYPES } from "@/adapters/redis/redis.types"
import type { IBullMQQueueService } from "./types"

@injectable()
export class BullMQQueueService implements IBullMQQueueService {
	constructor(
		@inject(REDIS_TYPES.Service) private readonly redisService: IRedisService,
	) {}

	getQueue(queueName: string, options?: Partial<QueueOptions>): Queue {
		return new Queue(queueName, {
			connection: this.redisService.getClient() as any,
			...options,
		})
	}

	async addJob<T>(queueName: string, name: string, data: T, options?: any): Promise<Job> {
		const queue = this.getQueue(queueName)
		const job = await queue.add(name, data, options)
		return job
	}
}
