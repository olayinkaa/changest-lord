import { ContainerModule } from "inversify"
import { cloudinaryConfig } from "@/config/adapters.config"
import { ADAPTER_TYPES } from "./adapters.types"
import { AnchorApiSdkService, type IAnchorApiSdk } from "./anchor-api-sdk/anchor.service"
import type { IAwsRekognitionService } from "./aws-rekognition/aws-rekogniction.type"
import { AwsRekognitionService } from "./aws-rekognition/aws-rekognition.service"
import { AwsSesService } from "./aws-ses/aws-ses.service"
import type { IAwsSesService } from "./aws-ses/aws-ses.types"
import { BullMQQueueService } from "./bullmq/queue.service"
import { BULLMQ_TYPES, type IBullMQQueueService } from "./bullmq/types"
import { CloudinaryService } from "./cloudinary/cloudinary.service"
import type { ICloudinaryService } from "./cloudinary/cloudinary.types"
import { GoogleMapsService } from "./google/google-map.service"
import type { IGoogleMapsService } from "./google/google-map.type"
import { RedisService } from "./redis/redis.service"
import { type IRedisService, REDIS_TYPES } from "./redis/redis.types"
import { VerificationFactory } from "./verification/verification.factory"
import type { IVerificationService } from "./verification/verification.types"

export const AdaptersModule = new ContainerModule((bind) => {
	bind<IGoogleMapsService>(ADAPTER_TYPES.GoogleMapsService).to(GoogleMapsService)
	bind<IAwsRekognitionService>(ADAPTER_TYPES.AwsRekognitionService).to(
		AwsRekognitionService,
	)
	bind<IAwsSesService>(ADAPTER_TYPES.AwsSesService).to(AwsSesService)
	bind<IAnchorApiSdk>(ADAPTER_TYPES.AnchorApiSdk).to(AnchorApiSdkService)
	bind<IRedisService>(REDIS_TYPES.Service).to(RedisService)
	bind<IBullMQQueueService>(BULLMQ_TYPES.QueueService).to(BullMQQueueService)
	bind<ICloudinaryService>(ADAPTER_TYPES.CloudinaryService).toDynamicValue(() => {
		return new CloudinaryService(cloudinaryConfig)
	})
	bind<IVerificationService>(ADAPTER_TYPES.VerificationService).toDynamicValue(
		VerificationFactory,
	)
})
