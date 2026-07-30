import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import type { BusinessType } from "@/generated/prisma/client"
import type { CreateBusinessTypeDto } from "./business-type.dto"
import type { IBusinessTypeRepository } from "./business-type.types"

@injectable()
export class BusinessTypeRepository implements IBusinessTypeRepository {
	async findAll(): Promise<BusinessType[]> {
		return prisma.businessType.findMany()
	}

	async findById(id: string): Promise<BusinessType | null> {
		return prisma.businessType.findUnique({
			where: { id },
		})
	}

	async create(data: CreateBusinessTypeDto): Promise<BusinessType> {
		return prisma.businessType.create({
			data,
		})
	}

	async update(id: string, data: Partial<BusinessType>): Promise<BusinessType> {
		return prisma.businessType.update({
			where: { id },
			data,
		})
	}

	async delete(id: string): Promise<BusinessType> {
		return prisma.businessType.delete({
			where: { id },
		})
	}

	async findByName(name: string): Promise<BusinessType | null> {
		return prisma.businessType.findFirst({
			where: { type: name },
		})
	}
}
