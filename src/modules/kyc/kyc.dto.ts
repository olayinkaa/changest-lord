import { Exclude, Expose } from "class-transformer"

// @Exclude()
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
