import { IsNotEmpty, IsString } from "class-validator"

export class UpdateSettingDto {
	//   @IsNotEmpty({ message: "Name is required" })
	@IsString({ message: "Name must be a string" })
	name?: string

	//   @IsNotEmpty({ message: "Description is required" })
	@IsString({ message: "Description must be a string" })
	description?: string

	@IsNotEmpty({ message: "Name is required" })
	value!: any
}
