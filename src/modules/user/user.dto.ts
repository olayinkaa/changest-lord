import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	ValidateIf,
} from "class-validator"
import { UserType } from "@/generated/prisma/enums"

export class ValidatePhoneRequest {
	@IsNotEmpty({ message: "Phone number is required" })
	@IsString({ message: "Phone number must be a string" })
	@Matches(/^\+?[0-9]{7,15}$/, {
		message: "Phone number must be 7–15 digits, optionally prefixed with '+'",
	})
	phone!: string
}

export class OnboardingRequest {
	@IsNotEmpty({ message: "First name is required" })
	@IsString({ message: "First name must be a string" })
	firstName!: string

	@IsNotEmpty({ message: "Last name is required" })
	@IsString({ message: "Last name must be a string" })
	lastName!: string

	@IsEmail({}, { message: "Invalid email format" })
	@IsNotEmpty({ message: "Email is required" })
	email!: string

	@IsNotEmpty({ message: "Home address is required" })
	@IsString({ message: "Home address must be a string" })
	homeAddress!: string

	@IsNotEmpty({ message: "User type is required" })
	@IsEnum(UserType, {
		message: `User type must be one of: ${Object.values(UserType).join(", ")}`,
	})
	userType!: UserType

	@IsOptional()
	@IsString()
	referralCode?: string

	@ValidateIf((o) => o.userType === UserType.seller)
	@IsString()
	@IsNotEmpty({ message: "Business name is required for seller" })
	businessName?: string

	@ValidateIf((o) => o.userType === UserType.seller)
	@IsString()
	@IsNotEmpty({ message: "Business location is required for seller" })
	businessLocation?: string

	@ValidateIf((o) => o.userType === UserType.seller)
	@IsString()
	@IsNotEmpty({ message: "Business type is required for seller" })
	businessType?: string
}
