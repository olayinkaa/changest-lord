import { Exclude, Expose, Type } from "class-transformer"
import { IsEnum, IsOptional, IsString } from "class-validator"
import { PaginationQueryDto } from "@/common/dto/pagination.dto"
import { UserType } from "@/generated/prisma/enums"
import { BusinessTypeResponseDto } from "../business-type/business-type.dto"
import { KycResponseDto } from "../kyc/kyc.dto"

/**
 * ==============================================================================
 * USER QUERY PARAMS
 * ==============================================================================
 */
export class UserQueryDto extends PaginationQueryDto {
	@IsOptional()
	@IsString()
	emailLike?: string

	@IsOptional()
	@IsString()
	businessNameLike?: string

	@IsOptional()
	@IsEnum(UserType)
	userType?: UserType
}

/**
 * ==============================================================================
 * USER RESPONSE DATA TRANSFER OBJECT
 * ==============================================================================
 */
export class UserBusinessTypeResponseDto extends BusinessTypeResponseDto {
	@Exclude()
	declare createdAt: Date
	@Exclude()
	declare updatedAt: Date
}

export class UserResponseDto {
	@Expose() id: string
	@Expose() email: string
	@Expose() phone: string
	@Expose() firstName: string
	@Expose() lastName: string
	@Expose() middleName?: string
	@Exclude() isMarkter: boolean
	@Expose() userType: string
	@Expose() businessLocation: string
	@Expose() businessName: string
	@Expose() address: string
	@Expose() nin?: string
	@Expose() bvn?: string
	@Expose() userId5?: string
	@Exclude() pinHash?: string
	@Exclude() businessTypeId?: string
	@Exclude() onboardingStep?: string
	@Expose() livenessImageUrl?: string
	@Exclude() livenessImagePublicId?: string
	@Expose() latitude?: number
	@Expose() longitude?: number
	@Expose() deviceBindingId?: string
	@Expose() virtualAccountNo?: string
	@Expose() createdAt: Date
	@Expose() updatedAt: Date
	@Expose() @Type(() => KycResponseDto) kyc?: KycResponseDto
	@Expose() @Type(() => UserBusinessTypeResponseDto) businessType?: any
	//
}
