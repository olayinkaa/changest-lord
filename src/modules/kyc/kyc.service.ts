import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekogniction.type"
import type { IVerificationService } from "@/adapters/verification/verification.types"
import { type IUtilityService, UTILITY_TYPES } from "@/common/utility/utility.type"
import { pinoLogger } from "@/config/pino-logger"
import { BadRequestException, NotFoundException } from "@/core/errors/exceptions"
import { ErrorType } from "@/types/enum"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import { type IKycRepository, type IKycService, KYC_TYPES } from "./kyc.types"

@injectable()
export class KycService implements IKycService {
	constructor(
		@inject(ADAPTER_TYPES.VerificationService)
		private verificationService: IVerificationService,
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
		@inject(KYC_TYPES.Repository) private readonly kycRepo: IKycRepository,
		@inject(UTILITY_TYPES.Service)
		private utilityService: IUtilityService,
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
	) {}

	//
	async getAllCachedBvns() {
		return this.kycRepo.getAllCachedBvns()
	}

	async getCachedBvnByID(id: string) {
		return this.kycRepo.findCachedBvnByID(id)
	}

	//
	async validateBvn(userId: string, bvn: string): Promise<any> {
		// Fetch the user from the database using the token's userId to get their uploaded profile image (Cloudinary URL)
		const user = await this.userRepo.findUser(userId)
		if (!user) {
			throw new NotFoundException("User not found")
		}

		// Assuming user model has the Cloudinary image field (e.g. user.image or user.profileImage)
		const cloudinaryImageUrl = user.livenessImageUrl // Adjust property name to match your schema if needed
		if (!cloudinaryImageUrl) {
			throw new BadRequestException(
				"Please do a liveness capture  before validating your BVN.",
			)
		}

		// Step 2: Check if BVN belongs to another existing user in your system
		const existingUser = await this.userRepo.findByBvn(bvn)
		// if (existingUser && existingUser.id !== userId) {
		if (existingUser) {
			throw new BadRequestException(
				"This BVN belongs to existing user. Please enter a new BVN",
				{
					errorType: ErrorType.BVN_ALREADY_EXISTS,
				},
			)
		}

		// Step 3: Check if BVN is already saved locally (cache check to save cost)
		let bvnData = await this.kycRepo.findBvnRecordLocally(bvn)

		if (!bvnData) {
			// Step 4: If not found locally, call Dojah to validate
			const result = await this.verificationService.verifyBVN(bvn)

			// Step 5: Save information locally
			bvnData = await this.kycRepo.saveBvnRecordLocally({
				bvn: bvn,
				firstName: result.first_name,
				lastName: result.last_name,
				dob: result.date_of_birth,
				phone: result.phone,
				image: result.image,
			})
		}

		if (!bvnData.image) {
			throw new BadRequestException(
				"BVN record does not contain an image for face verification.",
			)
		}

		// Step 6: Prepare BVN Image Buffer from Base64
		const bvnImageBuffer = this.utilityService.convertBase64ToBuffer(bvnData.image)

		// Step 7: Fetch Cloudinary image as Buffer using UtilityService
		const cloudinaryImageBuffer =
			await this.utilityService.fetchImageBufferFromUrl(cloudinaryImageUrl)

		// Step 8: Perform Face Comparison via AWS Rekognition (Threshold: 80%)
		const similarityScore = await this.awsRekognitionService.compareFaces(
			bvnImageBuffer,
			cloudinaryImageBuffer,
			80,
		)

		pinoLogger.info({ similarityScore }, "Similarity search")

		const isFaceMatched = similarityScore >= 80
		if (!isFaceMatched) {
			throw new BadRequestException(
				`The BVN entered doesn’t match your account details. Please enter the correct BVN.`,
				{
					errorType: ErrorType.FACE_MISMATCH,
					description: `Face verification failed. The face does not match the BVN record (Score: ${similarityScore.toFixed(2)}%)`,
				},
			)
		}

		// Step 9: Update user table and KYC flags in database
		await this.userRepo.updateBvnVerification(userId, bvn)

		return {
			description: "BVN verified and face matched successfully",
			similarityScore,
			bvnDetails: {
				bvn: bvnData.bvn,
				firstName: bvnData.firstName,
				lastName: bvnData.lastName,
				dob: bvnData.dob,
				phone: bvnData.phone,
				image: bvnData.image,
			},
		}
	}

	//
}
