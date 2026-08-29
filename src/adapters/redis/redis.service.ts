import Redis from "ioredis"
import { pinoLogger as logger } from "@/config/pino-logger"
import type { IRedisService } from "./redis.types"

export class RedisService implements IRedisService {
	private client: Redis

	constructor(connectionString: string) {
		this.client = new Redis(connectionString, {
			enableOfflineQueue: true,
		})

		this.client.on("connect", () => {
			logger.info("✅ Redis connected")
		})

		this.client.on("error", (err) => {
			logger.error({ err }, "❌ Redis connection error:")
		})
	}

	async get(key: string) {
		const data = await this.client.get(key)
		return data ? JSON.parse(data) : null
	}

	async set(key: string, value: any, ttlSeconds = 60 * 3) {
		await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds)
	}

	async del(key: string | string[]) {
		if (Array.isArray(key)) {
			if (key.length > 0) await this.client.del(...key)
		} else {
			await this.client.del(key)
		}
	}

	async invalidateCache(prefix: string) {
		const keys = await this.client.keys(`${prefix}:*`)
		if (keys.length > 0) {
			await this.del(keys)
			logger.info(`🔄 Invalidated ${keys.length} keys with prefix: ${prefix}`)
		}
	}

	getClient(): Redis {
		return this.client
	}
}
