import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class InitiateLivenessRequest {
	@IsNotEmpty({ message: "Token is required" })
	@IsString({ message: "Token must be a string" })
	token!: string

	@IsOptional() @IsString() callbackUrl?: string
}
