import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekogniction.type"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { constants, OnboardingScopes } from "@/constants"
import {
	BadRequestException,
	UnprocessableEntityException,
} from "@/core/errors/exceptions"
import { AUTH_TYPES, type IAuthUtils } from "../auth/auth.types"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import type { ILiveness, ILivenessResultResponse } from "./liveness.type"

@injectable()
export class LivenessService implements ILiveness {
	livenessRedirectUrl: string = "mychange://"
	passedThreshold: number = 90.0 // Confidence threshold for liveness evaluation

	constructor(
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
		@inject(AUTH_TYPES.AuthUtils) private readonly authUtils: IAuthUtils,
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
	) {}

	async initiateLivenessSession(userId: string) {
		// Idempotency engine: Deduplicates clicks to protect AWS billing
		// const dateHourString = new Date().toISOString().slice(0, 13); // Target hour format window
		// const sessionToken = `${userId}-${dateHourString}`; // Unique token for the user and hour

		const uniqueAttemptId = crypto.randomUUID()
		const sessionToken = `${userId}-${uniqueAttemptId}` //
		const hashedToken = this.authUtils.hashCode(sessionToken) // Hash the token for security

		const sessionId =
			await this.awsRekognitionService.initiateLivenessSession(hashedToken)
		if (!sessionId) {
			throw new UnprocessableEntityException("Failed to initiate Liveness Session")
		}

		return {
			sessionId,
			sessionToken,
			link: `${constants.LIVENESS_WEB_URL}?session_id=${sessionId}&redirect_url=${this.livenessRedirectUrl}`,
		}
	}

	async submitLivenessSessionCapture(user: IOnboardingUser, sessionId: string) {
		if (!sessionId) {
			throw new BadRequestException("sessionId is required")
		}
		try {
			const response: ILivenessResultResponse =
				await this.awsRekognitionService.getLivenessSessionResult(sessionId)
			const isLive =
				response.result.Status === "SUCCEEDED" &&
				response.result?.Confidence >= this.passedThreshold

			if (!isLive) {
				throw new UnprocessableEntityException(
					"Liveness evaluation failed. Please try again.",
				)
			}
			const bytesNumberArray = response.result?.ReferenceImage.Bytes
			const rawByteValues = Object.values(bytesNumberArray) as number[]
			const image = `data:image/jpeg;base64,${Buffer.from(rawByteValues).toString("base64")}`

			await this.userRepo.updateLivenessStatus(user.id)

			/**
			 * save image to cloudinary
			 * save imageUrl, publicId to user profile in database
			 */

			// payload for the new token with updated scope
			const payload = {
				userId: user.id,
				phone: user.phone,
				scope: OnboardingScopes.PIN,
			}

			// generate a new token for the user with updated scope
			const pinToken = this.authUtils.generateToken(
				payload,
				config.JWT_ONBOARDING_SECRET,
				"15m",
			)

			return {
				success: true,
				message: "Liveness evaluation passed.",
				image,
				temporaryToken: pinToken,
			}
		} catch (error: any) {
			pinoLogger.error({ error }, "Error in getting liveness session result")
			throw new BadRequestException(
				error?.message || "Invalid session ID format. It must be a valid UUID string",
			)
		}
	}
}
