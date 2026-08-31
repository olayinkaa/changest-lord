import type { Redis as RedisClient } from "ioredis"

export const REDIS_TYPES = {
	Service: Symbol.for("RedisService"),
} as const

export interface IRedisService {
	getClient(): RedisClient
	ping(): Promise<string>
	close(): Promise<void>
	get<T>(key: string): Promise<T | null>
	set(key: string, value: any, options?: { ttlSeconds?: number }): Promise<void>
	del(key: string | string[]): Promise<void>
	invalidateCache(prefix: string): Promise<void>
	fetchWithCache<T>({
		key,
		ttlSeconds,
		fetcher,
		disabled,
	}: {
		key: string
		ttlSeconds?: number
		fetcher: () => Promise<T>
		disabled?: boolean
	}): Promise<T>
	list: {
		range: (key: string, start: number, end: number) => Promise<string[]>
		trim: (key: string, start: number, end: number) => Promise<string>
		length: (key: string) => Promise<number>
		remove: (key: string, count: number, value: string) => Promise<number>
		push: {
			left: (key: string, value: string) => Promise<number>
			right: (key: string, value: string) => Promise<number>
		}
		pop: {
			left: (key: string) => Promise<string | null>
			right: (key: string) => Promise<string | null>
		}
	}
}
