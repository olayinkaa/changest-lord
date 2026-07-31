import { IsNotEmpty, IsString, Matches } from "class-validator"

export class LoginRequest {
	@IsNotEmpty({ message: "Phone number is required" })
	@IsString({ message: "Phone number must be a string" })
	@Matches(/^\+?[0-9]{7,15}$/, {
		message: "Phone number must be 7–15 digits, optionally prefixed with '+'",
	})
	phone!: string

	@IsNotEmpty({ message: "PIN is required" })
	@IsString({ message: "PIN must be a string" })
	@Matches(/^\d{4}$/, {
		message: "PIN must be exactly 4 digits",
	})
	pin!: string
}
