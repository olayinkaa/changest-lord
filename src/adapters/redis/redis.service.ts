import { injectable } from "inversify"
import Redis, { type Redis as RedisClient } from "ioredis"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { IRedisService } from "./redis.types"

@injectable()
export class RedisService implements IRedisService {
	private readonly pubClient: RedisClient
	private readonly subClient: RedisClient

	constructor() {
		// BullMQ requires maxRetriesPerRequest=null on connections that drive
		// blocking commands. See https://docs.bullmq.io/guide/connections
		const redisConfig = {
			maxRetriesPerRequest: null,
			enableReadyCheck: true,
			lazyConnect: false,
		}

		this.pubClient = new Redis(config.REDIS_URL, redisConfig)
		this.subClient = new Redis(config.REDIS_URL, redisConfig)

		this.pubClient.on("error", (err) => pinoLogger.error({ err }, "Redis pub client error"))
		this.subClient.on("error", (err) => pinoLogger.error({ err }, "Redis sub client error"))

		this.pubClient.on("connect", () => pinoLogger.info({ url: config.REDIS_URL }, "✅ Redis pub connected"))
		this.subClient.on("connect", () => pinoLogger.info({ url: config.REDIS_URL }, "✅ Redis sub connected"))
	}

	getClient(): RedisClient {
		return this.pubClient
	}

	async ping(): Promise<string> {
		return this.pubClient.ping()
	}

	async close(): Promise<void> {
		await Promise.all([this.pubClient.quit(), this.subClient.quit()])
	}

	async get<T>(key: string): Promise<T | null> {
		const data = await this.pubClient.get(key)
		if (!data) return null
		try {
			return JSON.parse(data) as T
		} catch {
			return data as any
		}
	}

	async set(key: string, value: any, options: { ttlSeconds?: number } = {}): Promise<void> {
		const ttl = options.ttlSeconds || 3600
		await this.pubClient.set(key, JSON.stringify(value), "EX", ttl)
	}

	async del(key: string | string[]): Promise<void> {
		if (Array.isArray(key)) {
			if (key.length > 0) await this.pubClient.del(...key)
		} else {
			await this.pubClient.del(key)
		}
	}

	async invalidateCache(prefix: string): Promise<void> {
		const keys = await this.pubClient.keys(`${prefix}:*`)
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
			range: (key: string, start: number, end: number) => this.pubClient.lrange(key, start, end),
			trim: (key: string, start: number, end: number) => this.pubClient.ltrim(key, start, end),
			length: (key: string) => this.pubClient.llen(key),
			remove: (key: string, count: number, value: string) => this.pubClient.lrem(key, count, value),
			push: {
				left: (key: string, value: string) => this.pubClient.lpush(key, value),
				right: (key: string, value: string) => this.pubClient.rpush(key, value),
			},
			pop: {
				left: (key: string) => this.pubClient.lpop(key),
				right: (key: string) => this.pubClient.rpop(key),
			},
		}
	}

	async publish(channel: string, message: string): Promise<void> {
		await this.pubClient.publish(channel, message)
	}

	async subscribe(channel: string, callback: (channel: string, message: string) => void): Promise<void> {
		await this.subClient.subscribe(channel)
		this.subClient.on("message", (chan, msg) => {
			if (chan === channel) {
				callback(chan, msg)
			}
		})
	}

	async unsubscribe(channel: string): Promise<void> {
		await this.subClient.unsubscribe(channel)
	}
}
