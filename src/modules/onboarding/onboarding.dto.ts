import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator"

export class ValidatePhoneRequest {
	@IsNotEmpty({ message: "Phone number is required" })
	@IsString({ message: "Phone number must be a string" })
	@Matches(/^0(70|80)\d{9}$/, {
		message: "Phone number must be 11 digits and start with 070 or 080",
	})
	phone!: string
}

export class UserDetailsRequest {
	@IsNotEmpty({ message: "First name is required" })
	@IsString()
	firstName!: string

	@IsNotEmpty({ message: "Last name is required" })
	@IsString()
	lastName!: string

	@IsEmail({}, { message: "Invalid email format" })
	@IsNotEmpty({ message: "Email is required" })
	email!: string

	@IsNotEmpty({ message: "Home address is required" })
	@IsString()
	address!: string
}

export class UserTypeRequest {
	@IsNotEmpty({ message: "User type is required" })
	@IsString()
	type!: "customer" | "seller"
}

export class SellerBusinessRequest {
	@IsNotEmpty({ message: "Business name is required" })
	@IsString()
	businessName!: string

	@IsNotEmpty({ message: "Business address is required" })
	@IsString()
	address!: string

	@IsNotEmpty({ message: "Latitude is required" })
	@IsString()
	latitude!: string

	@IsNotEmpty({ message: "Longitude is required" })
	@IsString()
	longitude!: string
}

export class LivenessVerifyRequest {
	@IsNotEmpty({ message: "Session ID is required" })
	@IsString()
	sessionId!: string
}

export class SecurityRequest {
	@IsNotEmpty({ message: "PIN is required" })
	@IsString()
	@Matches(/^\d{4}$/, { message: "PIN must be exactly 4 digits" })
	pin!: string
}

export class CompleteOnboardingRequest {
	@IsNotEmpty({ message: "Device ID is required" })
	@IsString()
	deviceId!: string

	@IsOptional()
	@IsString()
	deviceToken?: string
}
