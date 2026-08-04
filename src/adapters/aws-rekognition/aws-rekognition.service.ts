import {
	CreateFaceLivenessSessionCommand,
	GetFaceLivenessSessionResultsCommand,
	RekognitionClient,
} from "@aws-sdk/client-rekognition"
import { injectable } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { IAwsRekognitionService } from "./aws-rekogniction.type"

@injectable()
export class AwsRekognitionService implements IAwsRekognitionService {
	private rekognitionClient: RekognitionClient

	constructor() {
		this.rekognitionClient = new RekognitionClient({
			region: config.AWS_REKOGNITION_REGION,
		})
	}

	async initiateLivenessSession(token: string) {
		try {
			const command = new CreateFaceLivenessSessionCommand({
				ClientRequestToken: token,
				Settings: {
					ChallengePreferences: [
						{
							Type: "FaceMovementAndLightChallenge",
						},
					],
				},
			})
			const result = await this.rekognitionClient.send(command)
			return result?.SessionId
		} catch (e) {
			pinoLogger.error(e, "Error initiating liveness session")
			throw e
		}
	}

	async getLivenessSessionResult(sessionId: string) {
		try {
			const command = new GetFaceLivenessSessionResultsCommand({
				SessionId: sessionId,
			})
			const result = await this.rekognitionClient.send(command)
			return {
				score: result.Confidence,
				result,
			}
		} catch (e) {
			pinoLogger.error(e, "Error getting liveness session results")
			throw e
		}
	}
}
