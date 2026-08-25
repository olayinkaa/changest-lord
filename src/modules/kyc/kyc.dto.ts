import { Exclude, Expose } from "class-transformer"

export class KycResponseDto {
	@Expose() id: string
	@Exclude() userId: string
	@Expose() livenessDone: boolean
	@Expose() completedProfile: boolean
	@Exclude() emailVerified: boolean
	@Exclude() phoneVerified: boolean
	@Expose() ninVerified: boolean
	@Expose() bvnVerified: boolean
	@Expose() bvnFaceVerified: boolean
	@Exclude() locationVerified: boolean
	@Exclude() whatsappVerified: boolean
	@Expose() pinCreated: boolean
	@Expose() faceId: string
	@Exclude() isSmsVerified: boolean
}
