import {
	CreateFaceLivenessSessionCommand,
	GetFaceLivenessSessionResultsCommand,
	IndexFacesCommand,
	RekognitionClient,
	SearchUsersByImageCommand,
} from "@aws-sdk/client-rekognition"
import { injectable } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { IAwsRekognitionService } from "./aws-rekogniction.type"

@injectable()
export class AwsRekognitionService implements IAwsRekognitionService {
	private rekognitionClient: RekognitionClient
	private config: any

	constructor() {
		this.rekognitionClient = new RekognitionClient({
			region: config.AWS_REKOGNITION_REGION,
		})
		this.config = config
	}

	private resolveCollectionName(collectionName: string): string {
		return `${collectionName}-${this.config.APP_ENV}`
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

	/**
	 *
	 * @param collectionId
	 * @param imageBuffer
	 * @param identifier
	 * @returns
	 */
	async addFaceToCollection(
		collectionId: string,
		imageBuffer: Buffer,
		identifier: string,
	) {
		try {
			const command = new IndexFacesCommand({
				CollectionId: this.resolveCollectionName(collectionId),
				Image: { Bytes: imageBuffer },
				ExternalImageId: identifier,
				QualityFilter: "AUTO",
			})
			const response = await this.rekognitionClient.send(command)
			return response.FaceRecords
		} catch (e) {
			pinoLogger.error(e, `Error indexing face for collectionId: ${collectionId} `)
			throw e
		}
	}
	//
	async searchFaceInCollection(targetImageBuffer: Buffer, collectionId: string) {
		try {
			const command = new SearchUsersByImageCommand({
				CollectionId: this.resolveCollectionName(collectionId),
				Image: {
					Bytes: targetImageBuffer,
				},
				UserMatchThreshold: 95.0, // Minimum similarity percentage to flag a duplicate (e.g., 95%)
				MaxUsers: 1, // We only care if at least one match exists
			})
			const response = await this.rekognitionClient.send(command)
			return response
		} catch (e) {
			pinoLogger.error(e, `Error searching face for collectionId: ${collectionId} `)
			throw e
		}
	}
}
