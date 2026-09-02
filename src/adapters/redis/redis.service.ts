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
		this.client = new Redis(config.REDIS_URL, {
			maxRetriesPerRequest: null,
			enableReadyCheck: true,
			lazyConnect: false,
		})
		this.client.on("error", (err) => pinoLogger.error({ err }, "Redis client error"))
		this.client.on("connect", () =>
			pinoLogger.info({ url: config.REDIS_URL }, "✅ Redis connected"),
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

	async get<T>(key: string): Promise<T | null> {
		const data = await this.client.get(key)
		if (!data) return null
		try {
			return JSON.parse(data) as T
		} catch {
			return data as any
		}
	}

	async set(
		key: string,
		value: any,
		options: { ttlSeconds?: number } = {},
	): Promise<void> {
		const ttl = options.ttlSeconds || 3600
		await this.client.set(key, JSON.stringify(value), "EX", ttl)
	}

	async del(key: string | string[]): Promise<void> {
		if (Array.isArray(key)) {
			if (key.length > 0) await this.client.del(...key)
		} else {
			await this.client.del(key)
		}
	}

	async invalidateCache(prefix: string): Promise<void> {
		const keys = await this.client.keys(`${prefix}:*`)
		if (keys.length > 0) {
			await this.del(keys)
			pinoLogger.info(`🔄 Invalidated ${keys.length} keys with prefix: ${prefix}`)
		}
	}

	async fetchWithCache<T>({
		key,
		ttlSeconds = 3600,
		fetcher,
		disabled = false,
	}: {
		key: string
		ttlSeconds?: number
		fetcher: () => Promise<T>
		disabled?: boolean
	}): Promise<T> {
		const cachedData = await this.get<T>(key)
		if (cachedData && !disabled) {
			return cachedData
		}
		const freshData = await fetcher()
		await this.set(key, freshData, { ttlSeconds })
		return freshData
	}

	get list() {
		return {
			range: (key: string, start: number, end: number) =>
				this.client.lrange(key, start, end),
			trim: (key: string, start: number, end: number) =>
				this.client.ltrim(key, start, end),
			length: (key: string) => this.client.llen(key),
			remove: (key: string, count: number, value: string) =>
				this.client.lrem(key, count, value),
			push: {
				left: (key: string, value: string) => this.client.lpush(key, value),
				right: (key: string, value: string) => this.client.rpush(key, value),
			},
			pop: {
				left: (key: string) => this.client.lpop(key),
				right: (key: string) => this.client.rpop(key),
			},
		}
	}
}
