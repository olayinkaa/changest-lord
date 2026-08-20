import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	queryParam,
} from "inversify-express-utils"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsRekognitionService } from "@/adapters/aws-rekognition/aws-rekogniction.type"
import { pinoLogger } from "@/config/pino-logger"
import { AwsCollectionId } from "@/constants"
import { ApiResponse } from "@/utils/http-response"

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
	@httpGet("/rekognition/delete")
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
}
