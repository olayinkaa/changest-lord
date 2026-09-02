import {
	CompareFacesCommand,
	CreateCollectionCommand,
	CreateFaceLivenessSessionCommand,
	DeleteCollectionCommand,
	DeleteFacesCommand,
	DescribeCollectionCommand,
	GetFaceLivenessSessionResultsCommand,
	IndexFacesCommand,
	ListCollectionsCommand,
	ListFacesCommand,
	RekognitionClient,
	SearchFacesByImageCommand,
	// SearchUsersByImageCommand,
} from "@aws-sdk/client-rekognition"
import { injectable } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { IAwsRekognitionService } from "./aws-rekognition.type"

@injectable()
export class AwsRekognitionService implements IAwsRekognitionService {
	private rekognitionClient: RekognitionClient
	private config: any

	constructor() {
		this.rekognitionClient = new RekognitionClient({
			region: config.AWS_REGION,
		})
		this.config = config
	}

	private resolveCollectionName(collectionName: string): string {
		return `${collectionName}-${this.config.APP_ENV}`
	}

	/**
	 * Helper method to ensure a collection exists, creating it if it doesn't.
	 */
	public async ensureCollectionExists(collectionId: string): Promise<void> {
		const resolvedName = this.resolveCollectionName(collectionId)
		try {
			await this.rekognitionClient.send(
				new DescribeCollectionCommand({ CollectionId: resolvedName }),
			)
			pinoLogger.info(`AWS Rekognition collection '${resolvedName}' exists.`)
		} catch (error: any) {
			if (error.name === "ResourceNotFoundException") {
				pinoLogger.info(`Collection '${resolvedName}' not found. Creating it now...`)
				await this.createCollection(collectionId)
				pinoLogger.info(
					`✅ Successfully created AWS Rekognition collection: '${resolvedName}'`,
				)
			} else {
				pinoLogger.error(error, `Error checking/creating collection: ${resolvedName}`)
				throw error
			}
		}
	}

	async initiateLivenessSession(token: string) {
		try {
			const command = new CreateFaceLivenessSessionCommand({
				ClientRequestToken: token,
				Settings: {
					ChallengePreferences: [
						{
							// Type: "FaceMovementAndLightChallenge",
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

	async compareFaces(
		sourceImageBuffer: Buffer,
		targetImageBuffer: Buffer,
		similarityThreshold: number = 98,
	): Promise<number> {
		try {
			const command = new CompareFacesCommand({
				SourceImage: { Bytes: sourceImageBuffer },
				TargetImage: { Bytes: targetImageBuffer },
				SimilarityThreshold: similarityThreshold,
			})

			const response = await this.rekognitionClient.send(command)

			// Check if a match was found
			const match = response.FaceMatches?.[0]
			if (!match?.Similarity) {
				return 0 // No match found
			}
			return match.Similarity // Returns confidence percentage (e.g., 95.5)
		} catch (e) {
			pinoLogger.error(e, "Error comparing faces")
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
	// 2. Added implementation for deleting face vectors from collection
	async deleteFacesFromCollection(
		collectionId: string,
		faceIds: string[],
	): Promise<string[]> {
		try {
			const command = new DeleteFacesCommand({
				CollectionId: this.resolveCollectionName(collectionId),
				FaceIds: faceIds,
			})
			const response = await this.rekognitionClient.send(command)
			return response.DeletedFaces || []
		} catch (e) {
			pinoLogger.error(e, `Error deleting faces from collectionId: ${collectionId}`)
			throw e
		}
	}
	//
	async searchFaceInCollection(targetImageBuffer: Buffer, collectionId: string) {
		try {
			// const command = new SearchUsersByImageCommand({
			//   CollectionId: this.resolveCollectionName(collectionId),
			//   Image: {
			//     Bytes: targetImageBuffer,
			//   },
			//   UserMatchThreshold: 95.0,
			//   MaxUsers: 1,
			// });
			const command = new SearchFacesByImageCommand({
				CollectionId: this.resolveCollectionName(collectionId),
				Image: {
					Bytes: targetImageBuffer,
				},
				FaceMatchThreshold: 95.0,
				MaxFaces: 1,
			})
			const response = await this.rekognitionClient.send(command)
			return response
		} catch (e) {
			pinoLogger.error(e, `Error searching face for collectionId: ${collectionId} `)
			throw e
		}
	}
	//
	async createCollection(collectionId: string) {
		try {
			const command = new CreateCollectionCommand({
				CollectionId: this.resolveCollectionName(collectionId),
			})
			const response = await this.rekognitionClient.send(command)
			return response
		} catch (e) {
			pinoLogger.error(e, `Error creating collectionId: ${collectionId} `)
			throw e
		}
	}
	//
	async listCollections(): Promise<string[]> {
		try {
			const command = new ListCollectionsCommand({})
			const response = await this.rekognitionClient.send(command)
			return response.CollectionIds || []
		} catch (e) {
			pinoLogger.error(e, "Error listing Rekognition collections")
			throw e
		}
	}
	//
	async deleteCollection(collectionId: string) {
		try {
			const command = new DeleteCollectionCommand({
				CollectionId: this.resolveCollectionName(collectionId),
			})
			const response = await this.rekognitionClient.send(command)
			return response
		} catch (e) {
			pinoLogger.error(e, `Error deleting collectionId: ${collectionId} `)
			throw e
		}
	}
	//
	async describeCollectionDetails(collectionId: string) {
		try {
			const resolvedName = this.resolveCollectionName(collectionId)
			const command = new DescribeCollectionCommand({
				CollectionId: resolvedName,
			})
			const response = await this.rekognitionClient.send(command)
			return {
				collectionArn: response.CollectionARN,
				faceCount: response.FaceCount,
				userCount: response.UserCount,
				faceModelVersion: response.FaceModelVersion,
				createdAt: response.CreationTimestamp,
			}
		} catch (e) {
			pinoLogger.error(e, `Error describing collection: ${collectionId}`)
			throw e
		}
	}

	async listFacesInCollection(collectionId: string) {
		try {
			const resolvedName = this.resolveCollectionName(collectionId)
			const command = new ListFacesCommand({ CollectionId: resolvedName })
			const response = await this.rekognitionClient.send(command)
			return response.Faces || [] // Returns face IDs, ExternalImageIds (user.id), etc.
		} catch (e) {
			pinoLogger.error(e, `Error listing faces for collection: ${collectionId}`)
			throw e
		}
	}
}
