import type Redis from "ioredis"

export interface IRedisService {
	get(key: string): Promise<any>
	set(key: string, value: any, ttlSeconds?: number): Promise<void>
	del(key: string | string[]): Promise<void>
	invalidateCache(prefix: string): Promise<void>
	getClient(): Redis
}
