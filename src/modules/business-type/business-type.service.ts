import { inject, injectable } from "inversify"
import { BadRequestException, NotFoundException } from "@/core/errors/exceptions"
import type { BusinessType } from "@/generated/prisma/client"
import type { CreateBusinessTypeDto, UpdateBusinessTypeDto } from "./business-type.dto"
import {
	BUSINESS_TYPES,
	type IBusinessTypeRepository,
	type IBusinessTypeService,
} from "./business-type.types"

@injectable()
export class BusinessTypeService implements IBusinessTypeService {
	constructor(
		@inject(BUSINESS_TYPES.Repository)
		private readonly repository: IBusinessTypeRepository,
	) {}

	async getAllBusinessTypes(): Promise<BusinessType[]> {
		return this.repository.findAll()
	}

	async getBusinessTypeById(id: string): Promise<BusinessType> {
		const businessType = await this.repository.findById(id)
		if (!businessType) {
			throw new NotFoundException(`Business Type with ID "${id}" not found`)
		}
		return businessType
	}

	async createBusinessType(data: CreateBusinessTypeDto): Promise<BusinessType> {
		const existing = await this.repository.findByName(data.type)
		if (existing) {
			throw new BadRequestException("Business type already exists")
		}
		return this.repository.create(data)
	}

	async updateBusinessType(
		id: string,
		data: UpdateBusinessTypeDto,
	): Promise<BusinessType> {
		await this.getBusinessTypeById(id)
		return this.repository.update(id, data)
	}

	async deleteBusinessType(id: string): Promise<BusinessType> {
		await this.getBusinessTypeById(id)
		return this.repository.delete(id)
	}
}
