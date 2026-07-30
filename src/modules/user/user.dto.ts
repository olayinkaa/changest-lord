import { IsNotEmpty, IsString } from "class-validator"

export class UserRequest {
	@IsNotEmpty({ message: "First name is required" })
	@IsString({ message: "First name must be a string" })
	firstName!: string

	@IsNotEmpty({ message: "Last name is required" })
	@IsString({ message: "Last name must be a string" })
	lastName!: string
}

export class UserPhoneRequest {
	@IsNotEmpty({ message: "First name is required" })
	@IsString({ message: "First name must be a string" })
	phoneNumber!: string
}
