import { IsNotEmpty, IsString, Matches } from "class-validator"
import { TransformNigeriaPhone } from "@/utils/custom-transformer"
import { IsNigeriaPhone } from "@/utils/custom-validator"

export class LoginRequest {
	@IsNotEmpty({ message: "Phone number is required" })
	@IsString({ message: "Phone number must be a string" })
	@TransformNigeriaPhone()
	@IsNigeriaPhone()
	phone!: string

	@IsNotEmpty({ message: "PIN is required" })
	@IsString({ message: "PIN must be a string" })
	@Matches(/^\d{4}$/, {
		message: "PIN must be exactly 4 digits",
	})
	pin!: string
}
