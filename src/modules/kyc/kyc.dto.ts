import { Exclude, Expose } from "class-transformer"
import { IsString, Length } from "class-validator"

export class KycResponseDto {
	@Expose() id: string
	@Expose() userId: string
	@Expose() livenessDone: boolean
	@Expose() completedProfile: boolean
	@Exclude() emailVerified: boolean
	@Exclude() phoneVerified: boolean
	@Expose() ninVerified: boolean
	@Expose() bvnVerified: boolean
	@Exclude() locationVerified: boolean
	@Exclude() whatsappVerified: boolean
	@Expose() pinCreated: boolean
	@Exclude() isSmsVerified: boolean
}

export class VerifyBvnDto {
	@IsString()
	@Length(11, 11, { message: "BVN must be exactly 11 digits" })
	bvn: string
}
