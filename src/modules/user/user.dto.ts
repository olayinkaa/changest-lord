import { IsNotEmpty, IsString, Matches } from "class-validator"

export class UserRequest {
	@IsNotEmpty({ message: "First name is required" })
	@IsString({ message: "First name must be a string" })
	firstName!: string

	@IsNotEmpty({ message: "Last name is required" })
	@IsString({ message: "Last name must be a string" })
	lastName!: string
}

export class ValidatePhoneRequest {
	@IsNotEmpty({ message: "Phone number is required" })
	@IsString({ message: "Phone number must be a string" })
	@Matches(/^\+?[0-9]{7,15}$/, {
		message: "Phone number must be 7–15 digits, optionally prefixed with '+'",
	})
	phone!: string
}
