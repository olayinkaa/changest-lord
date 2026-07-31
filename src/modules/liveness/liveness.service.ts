import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekogniction.type"
import {
	BadRequestException,
	UnprocessableEntityException,
} from "@/core/errors/exceptions"
import type { InitiateLivenessRequest } from "./liveness.dto"
import type { ILiveness } from "./liveness.type"

@injectable()
export class LivenessService implements ILiveness {
	livenessRedirectUrl: string = "mychange://"

	constructor(
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
	) {}

	async initiateLivenessSession(data: InitiateLivenessRequest) {
		const sessionToken = data.token
		const sessionId =
			await this.awsRekognitionService.initiateLivenessSession(sessionToken)
		if (!sessionId) {
			throw new UnprocessableEntityException("Failed to initiate AWS Liveness Session")
		}
		return {
			sessionId,
			sessionToken,
			link: `https://www.myfacecard.ai/liveness?session_id=${sessionId}`,
			// link: `https://www.myfacecard.ai/liveness?session_id=${sessionId}&redirect_url=${this.livenessRedirectUrl}`,
		}
	}

	async getLivenessSessionResult(sessionId: string) {
		if (!sessionId) {
			throw new BadRequestException("sessionId is required")
		}
		try {
			const result = await this.awsRekognitionService.getLivenessSessionResult(sessionId)
			return result
		} catch (error: any) {
			if (
				error.name === "ValidationException" ||
				error.__type === "ValidationException"
			) {
				throw new BadRequestException(
					error?.message || "Invalid session ID format. It must be a valid UUID string",
				)
			}
		}
	}
}
