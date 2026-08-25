import { Expose } from "class-transformer"
import { IsString, Length } from "class-validator"

export class bvnResponseDto {
	@Expose() id: string
	@Expose() firstName: string
	@Expose() lastName: string
}

export class VerifyBvnDto {
	@IsString()
	@Length(11, 11, { message: "BVN must be exactly 11 digits" })
	bvn: string
}
