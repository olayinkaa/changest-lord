import {
	CreateFaceLivenessSessionCommand,
	GetFaceLivenessSessionResultsCommand,
	RekognitionClient,
} from "@aws-sdk/client-rekognition"
import { injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import type { IAwsRekognitionService } from "./aws-rekogniction.type"

@injectable()
export class AwsRekognitionService implements IAwsRekognitionService {
	//   private CONFIDENCE_THRESHOLD = 98;
	private rekognitionClient: RekognitionClient

	constructor() {
		this.rekognitionClient = new RekognitionClient({
			region: process.env.AWS_REGION || "us-east-1",
		})
	}

	async initiateLivenessSession(token: string) {
		try {
			const command = new CreateFaceLivenessSessionCommand({
				ClientRequestToken: token,
				Settings: {
					ChallengePreferences: [
						{
							Type: "FaceMovementChallenge",
						},
					],
				},
			})
			const result = await this.rekognitionClient.send(command)
			return result?.SessionId
		} catch (e) {
			pinoLogger.error(e, "Error initiating liveness session")
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
		}
	}
}
