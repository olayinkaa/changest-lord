import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
} from "class-validator"
import { UserType } from "@/generated/prisma/enums"
import { TransformNigeriaPhone } from "@/utils/custom-transformer"
import { IsNigeriaPhone } from "@/utils/custom-validator"

/**
 *
 */
export class ValidatePhoneRequest {
	@IsNotEmpty({ message: "Phone number is required" })
	@IsString({ message: "Phone number must be a string" })
	@TransformNigeriaPhone()
	@IsNigeriaPhone()
	phone!: string
}

/**
 *
 */
export class OnboardingProfileRequest {
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

	@IsOptional() @IsString() referralCode?: string
}

export class OnboardingBusinessProfileRequest {
	@IsString()
	@IsNotEmpty({ message: "Business name is required" })
	businessName!: string

	@IsString()
	@IsNotEmpty({ message: "Business location is required" })
	businessLocation!: string

	@IsString()
	@IsNotEmpty({ message: "Business type is required" })
	businessTypeId!: string
}

/**
 *
 */
export class CreatePinRequest {
	@IsNotEmpty({ message: "PIN is required" })
	@IsString({ message: "PIN must be a string" })
	@Matches(/^\d{4}$/, {
		message: "PIN must be exactly 4 digits",
	})
	pin!: string
}

/**
 *
 */
export class SubmitLivenessCaptureRequest {
	@IsNotEmpty({ message: "Image string is required" })
	@IsString({ message: "Image must be a string" })
	image!: string
}
