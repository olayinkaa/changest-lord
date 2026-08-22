import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpDelete,
	httpGet,
	queryParam,
	requestBody,
} from "inversify-express-utils"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekogniction.type"
import { pinoLogger } from "@/config/pino-logger"
import { AwsCollectionId } from "@/constants"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { DeleteFacesDto } from "./liveness.dto"

@controller("/liveness")
export class LivenessController extends BaseHttpController {
	constructor(
		@inject(ADAPTER_TYPES.AwsRekognitionService)
		private awsRekognitionService: IAwsRekognitionService,
	) {
		super()
	}

	@httpGet("/rekognition/collections")
	public async getRekognitionCollections() {
		try {
			const collections = await this.awsRekognitionService.listCollections()
			return this.json(ApiResponse.success({ collections }))
		} catch (e) {
			pinoLogger.error({ error: e })
			return this.json(ApiResponse.error("Failed to fetch collections"), 500)
		}
	}
	//
	@httpGet("/rekognition/collection/details")
	public async getCollectionDetails() {
		try {
			const collectionId = AwsCollectionId.USERS
			const details =
				await this.awsRekognitionService.describeCollectionDetails(collectionId)
			const faces = await this.awsRekognitionService.listFacesInCollection(collectionId)
			return this.json({
				success: true,
				details,
				faces,
			})
		} catch (error: any) {
			pinoLogger.error({ error })
			return this.json(ApiResponse.error("Failed to fetch collections"), 500)
		}
	}
	//
	@httpGet("/rekognition/collection/delete")
	public async deleteCollectionRekognition(
		@queryParam("collectionName") collectionName: string,
	) {
		try {
			await this.awsRekognitionService.deleteCollection(collectionName)
			return this.json({
				success: true,
				message: "Rekognition collection reset successfully!",
			})
		} catch (error: any) {
			pinoLogger.error({ error })
			return this.json(
				ApiResponse.error(
					{
						success: false,
						message: error.message,
					},
					"Failed to fetch collections",
				),
				500,
			)
		}
	}
	//
	@httpDelete("/rekognition/faces")
	@validateSchema(DeleteFacesDto)
	public async deleteFacesFromCollection(
		@requestBody() body: DeleteFacesDto,
		@queryParam("collectionId") collectionId?: string,
	) {
		try {
			// Default to your standard USERS collection if collectionId query param isn't provided
			const targetCollectionId = collectionId || AwsCollectionId.USERS
			const deletedFaces = await this.awsRekognitionService.deleteFacesFromCollection(
				targetCollectionId,
				body.faceIds,
			)

			return this.json(
				ApiResponse.success(
					{ deletedFaces },
					`Successfully deleted ${deletedFaces.length} face(s) from collection`,
				),
				200,
			)
		} catch (error: any) {
			pinoLogger.error({ error }, "Failed to delete faces from collection")
			return this.json(ApiResponse.error(error.message || "Failed to delete faces"), 500)
		}
	}
}
