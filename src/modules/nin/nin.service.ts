import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekognition.type"
import type { IVerificationService } from "@/adapters/verification/verification.types"
import { type IUtilityService, UTILITY_TYPES } from "@/common/utility/utility.type"
import { pinoLogger } from "@/config/pino-logger"
import {
	BadRequestException,
	HttpException,
	InternalServerErrorException,
	NotFoundException,
} from "@/core/errors/exceptions"
import { ErrorType } from "@/types/enum"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import { type INinRepository, type INinService, NIN_TYPES } from "./nin.types"

@injectable()
export class NinService implements INinService {
	constructor(
		@inject(ADAPTER_TYPES.VerificationService)
		private verificationService: IVerificationService,
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
		@inject(NIN_TYPES.Repository) private readonly NINRepo: INinRepository,
		@inject(UTILITY_TYPES.Service)
		private utilityService: IUtilityService,
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
	) {}

	//
	async getAllCachedNins() {
		return this.NINRepo.getAllCachedNins()
	}

	async getCachedNinByID(id: string) {
		return this.NINRepo.findCachedNinByID(id)
	}

	//
	async validateNin(userId: string, nin: string): Promise<any> {
		try {
			// Fetch user & check liveness image
			const user = await this.userRepo.findUser(userId)
			if (!user) {
				throw new NotFoundException("User not found")
			}

			const cloudinaryImageUrl = user.livenessImageUrl
			if (!cloudinaryImageUrl) {
				throw new BadRequestException(
					"Please do a liveness capture before validating your NIN.",
				)
			}

			// Check if NIN belongs to another existing user
			const existingUser = await this.userRepo.findByNin(nin)
			if (existingUser) {
				throw new BadRequestException(
					"This NIN belongs to existing user. Please enter a new NIN",
					{
						errorType: ErrorType.NIN_ALREADY_EXIST,
					},
				)
			}

			// Check if NIN is saved locally
			let ninData = await this.NINRepo.findNinRecordLocally(nin)

			if (!ninData) {
				// Call Dojah to validate (External network call)
				const result = await this.verificationService.verifyNIN(nin)
				let firstName: string
				let lastName: string
				let dob: string
				let phone: string
				let image: string
				// Save information locally
				if (result.provider === "dojah") {
					firstName = result.entity.first_name
					lastName = result.entity.last_name
					dob = result.entity.date_of_birth
					phone = result.entity.phone_number
					image = result.entity.photo
				} else {
					throw new InternalServerErrorException(
						"Unsupported verification provider response structure.",
					)
				}

				ninData = await this.NINRepo.saveNinRecordLocally({
					nin: nin,
					firstName,
					lastName,
					dob,
					phone,
					image,
				})
			}

			if (!ninData.image) {
				throw new BadRequestException(
					"BVN record does not contain an image for face verification.",
				)
			}

			// Convert BVN Image Buffer
			const ninImageBuffer = this.utilityService.convertBase64ToBuffer(ninData.image)

			// Fetch Cloudinary image as Buffer (External network call)
			const cloudinaryImageBuffer =
				await this.utilityService.fetchImageBufferFromUrl(cloudinaryImageUrl)

			// Perform Face Comparison via AWS Rekognition (External service call)
			const similarityScore = await this.awsRekognitionService.compareFaces(
				ninImageBuffer,
				cloudinaryImageBuffer,
				80,
			)

			pinoLogger.info({ similarityScore }, "Similarity search")

			const isFaceMatched = similarityScore >= 80
			if (!isFaceMatched) {
				throw new BadRequestException(
					`The NIN entered doesn’t match your account details. Please enter the correct NIN.`,
					{
						errorType: ErrorType.FACE_MISMATCH,
						description: `Face verification failed. The face does not match the NIN record (Score: ${similarityScore.toFixed(2)}%)`,
					},
				)
			}

			// Update user table and KYC flags
			await this.userRepo.updateNinVerification(userId, nin)

			return {
				description: "NIN verified successfully",
				similarityScore,
				ninDetails: {
					nin: nin,
					firstName: ninData.firstName,
					lastName: ninData.lastName,
					dob: ninData.dob,
					phone: ninData.phone,
					image: ninData.image,
				},
			}
		} catch (error) {
			// Re-throw HTTP exceptions so they retain their status codes (400, 404, etc.)
			if (error instanceof HttpException) {
				throw error
			}

			// Log unexpected internal errors or third-party failures
			pinoLogger.error({ err: error, userId, nin }, "Error during NIN validation process")

			// Wrap unexpected errors into a generic internal or bad gateway exception
			throw new InternalServerErrorException(
				"An error occurred while validating your NIN. Please try again later.",
			)
		}
	}

	//
}
