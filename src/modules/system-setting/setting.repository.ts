import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { SystemSetting } from "@/generated/prisma/client"

@injectable()
export class SettingRepository {
	public async findAll(): Promise<SystemSetting[]> {
		return prisma.systemSetting.findMany()
	}

	public async findByKey(key: string): Promise<SystemSetting | null> {
		return prisma.systemSetting.findUnique({
			where: { key },
		})
	}

	public async updateSetting(key: string, value: string): Promise<SystemSetting> {
		return prisma.systemSetting.update({
			where: { key },
			data: { value },
		})
	}

	public async upsertSetting(key: string, name: string, value: string, description?: string): Promise<SystemSetting> {
		return prisma.systemSetting.upsert({
			where: { key },
			update: { name, description }, // Preserve the 'value' if the record already exists
			create: { key, name, value, description },
		})
	}
}
