import { Expose } from "class-transformer"
import { IsNotEmpty, IsString } from "class-validator"
import z from "zod"

export class CreateBusinessTypeDto {
	@IsString()
	@IsNotEmpty({ message: "Business type is required" })
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

/**
 *
 */

export const BusinessSchema = z.object({
	type: z.string().min(1, { error: "Business type is required" }),
	description: z.string().min(1, { error: "Business description is required" }),
})

export type BusinessInputs = z.infer<typeof BusinessSchema>
