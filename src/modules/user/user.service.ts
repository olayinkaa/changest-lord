import { plainToInstance } from "class-transformer"
import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekognition.type"
import type { ICloudinaryService } from "@/adapters/cloudinary/cloudinary.types"
import { pinoLogger } from "@/config/pino-logger"
import { AwsCollectionId } from "@/constants"
import { NotFoundException, UnprocessableEntityException } from "@/core/errors/exceptions"
import type { PaginatedResponse } from "@/types/base"
import { type UserQueryDto, UserResponseDto } from "./user.dto"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@injectable()
export class UserService implements IUserService {
	constructor(
		@inject(USER_TYPES.Repository)
		private userRepository: IUserRepository,
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
		@inject(ADAPTER_TYPES.CloudinaryService)
		private cloudinaryService: ICloudinaryService,
	) {}

	async getAllUsers(query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
		const { content, total } = await this.userRepository.findAll(query)
		const sanitizedResult = plainToInstance(UserResponseDto, content, {
			excludeExtraneousValues: true,
		})
		return {
			content: sanitizedResult,
			page: query.page,
			size: query.size,
			totalPages: Math.ceil(total / query.size),
			totalElements: total,
		}
	}

	async getUser(id: string) {
		const result = await this.userRepository.findUser(id)
		const sanitizedResult = plainToInstance(UserResponseDto, result, {
			excludeExtraneousValues: true,
		})
		return sanitizedResult
	}

	async deleteUser(id: string) {
		const user = await this.userRepository.findUser(id)
		if (!user) {
			throw new NotFoundException("User not found")
		}
		if (user.kyc?.faceId) {
			try {
				await this.awsRekognitionService.deleteFacesFromCollection(
					AwsCollectionId.USERS,
					[user.kyc.faceId],
				)
			} catch (awsError) {
				pinoLogger.error(
					{ awsError, userId: id, faceId: user.kyc.faceId },
					"Failed to delete face from AWS Rekognition during user deletion",
				)
				throw new UnprocessableEntityException(
					"Failed to clean up biometric data from cloud provider.",
				)
			}
		}
		// 2. Delete liveness image from Cloudinary if publicId exists
		if (user.livenessImagePublicId) {
			try {
				await this.cloudinaryService.destroy(user.livenessImagePublicId)
				pinoLogger.info(
					{ publicId: user.livenessImagePublicId, userId: id },
					"Deleted user liveness image from Cloudinary",
				)
			} catch (cloudinaryError) {
				// Log the error but you can choose whether to block deletion or proceed.
				// Typically safe to log and continue so orphaned records don't lock account deletion.
				pinoLogger.error(
					{ cloudinaryError, userId: id, publicId: user.livenessImagePublicId },
					"Failed to delete image from Cloudinary during user deletion",
				)
			}
		}
		// Delete the user from the database (Cascades to UserKyc and UserDevice)
		await this.userRepository.deleteUser(id)
		return "The user information has been successfully deleted"
	}
}
