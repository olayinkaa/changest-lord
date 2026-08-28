import { injectable } from "inversify"
import Redis, { type Redis as RedisClient } from "ioredis"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { IRedisService } from "./redis.types"

@injectable()
export class RedisService implements IRedisService {
	private readonly client: RedisClient

	constructor() {
		// BullMQ requires maxRetriesPerRequest=null on connections that drive
		// blocking commands. See https://docs.bullmq.io/guide/connections
		this.client = new Redis({
			host: config.REDIS_HOST,
			port: config.REDIS_PORT,
			username: config.REDIS_USERNAME,
			password: config.REDIS_PASSWORD,
			db: config.REDIS_DB,
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			lazyConnect: false,
		})
		this.client.on("error", (err) => pinoLogger.error({ err }, "Redis client error"))
		this.client.on("connect", () =>
			pinoLogger.info(
				{ host: config.REDIS_HOST, port: config.REDIS_PORT },
				"Redis connected",
			),
		)
	}

	getClient(): RedisClient {
		return this.client
	}

	async ping(): Promise<string> {
		return this.client.ping()
	}

	async close(): Promise<void> {
		await this.client.quit()
	}
}
