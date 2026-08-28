import type { Redis as RedisClient } from "ioredis"

export const REDIS_TYPES = {
	Service: Symbol.for("RedisService"),
} as const

export interface IRedisService {
	getClient(): RedisClient
	ping(): Promise<string>
	close(): Promise<void>
}
