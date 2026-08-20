import type { BusinessType } from "@/generated/prisma/client"
import type { CreateBusinessTypeDto } from "./business-type.dto"

export const BUSINESS_TYPES = {
	Repository: Symbol.for("BusinessTypeRepository"),
	Service: Symbol.for("BusinessTypeService"),
}

export interface IBusinessTypeRepository {
	findAll(): Promise<BusinessType[]>
	findById(id: string): Promise<BusinessType | null>
	create(data: Partial<BusinessType>): Promise<BusinessType>
	update(id: string, data: Partial<BusinessType>): Promise<BusinessType>
	delete(id: string): Promise<BusinessType>
	findByName(name: string): Promise<BusinessType | null>
}

export interface IBusinessTypeService {
	getAllBusinessTypes(): Promise<BusinessType[]>
	getBusinessTypeById(id: string): Promise<BusinessType>
	createBusinessType(data: CreateBusinessTypeDto): Promise<BusinessType>
	updateBusinessType(id: string, data: Partial<BusinessType>): Promise<BusinessType>
	deleteBusinessType(id: string): Promise<BusinessType>
}
