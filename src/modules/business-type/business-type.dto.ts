import { Expose } from "class-transformer"
import { IsNotEmpty, IsString } from "class-validator"

export class CreateBusinessTypeDto {
	@IsString()
	@IsNotEmpty({ message: "Business yype is required" })
	type!: string

	@IsString()
	@IsNotEmpty({ message: "Business description is required" })
	description!: string
}

export class UpdateBusinessTypeDto extends CreateBusinessTypeDto {}

export class BusinessTypeResponseDto {
	@Expose() id!: string
	@Expose() type!: string
	@Expose() description!: string
	// @Exclude() userId!: string;
	@Expose() createdAt!: Date
	@Expose() updatedAt!: Date
}
