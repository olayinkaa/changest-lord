import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IRedisService } from "@/adapters/redis/redis.types"
import { DEFAULT_SYSTEM_SETTINGS } from "@/constants"
import type { SystemSetting } from "@/generated/prisma/client"
import type { SettingRepository } from "./setting.repository"
import { SETTING_TYPES } from "./setting.type"

@injectable()
export class SettingService {
	private readonly CACHE_TTL = 300
	private readonly key: string = "system_setting"
	constructor(
		@inject(SETTING_TYPES.Repository)
		private readonly settingRepo: SettingRepository,
		@inject(ADAPTER_TYPES.RedisService)
		private readonly redisService: IRedisService,
	) {}

	private generateCacheKeys(query: any) {
		return `${this.key}:${JSON.stringify(query)}`
	}

	public async seedSettings(): Promise<void> {
		for (const setting of DEFAULT_SYSTEM_SETTINGS) {
			await this.settingRepo.upsertSetting(setting.key, setting.name, setting.value, setting.description)
		}
	}

	public async getAllSettings(): Promise<SystemSetting[]> {
		return this.settingRepo.findAll()
	}

	public async getSetting<T = string>(key: string, defaultValue: T): Promise<T> {
		const cacheKey = this.generateCacheKeys(key)

		return this.redisService.fetchWithCache({
			key: cacheKey,
			ttlSeconds: this.CACHE_TTL,
			fetcher: async () => {
				const setting = await this.settingRepo.findByKey(key)

				if (!setting || setting.value === null || setting.value === undefined) {
					return defaultValue
				}

				try {
					return JSON.parse(setting.value) as T
				} catch {
					return setting.value as unknown as T
				}
			},
		})
	}

	public async updateSetting(key: string, value: string): Promise<SystemSetting> {
		const cacheKey = this.generateCacheKeys(key)
		const updated = await this.settingRepo.updateSetting(key, value)
		await this.redisService.del(cacheKey)
		return updated
	}

	public async upsertSetting(key: string, name: string, value: string, description?: string): Promise<SystemSetting> {
		const cacheKey = this.generateCacheKeys(key)
		const upserted = await this.settingRepo.upsertSetting(key, name, value, description)
		await this.redisService.del(cacheKey)
		return upserted
	}
}
