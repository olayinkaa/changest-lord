import { ContainerModule } from "inversify"
import { cloudinaryConfig } from "@/config/adapters.config"
import { ADAPTER_TYPES } from "./adapters.types"
import { AnchorApiSdkService, type IAnchorApiSdk } from "./anchor-api-sdk/anchor.service"
import type { IAwsRekognitionService } from "./aws-rekognition/aws-rekogniction.type"
import { AwsRekognitionService } from "./aws-rekognition/aws-rekognition.service"
import { CloudinaryService } from "./cloudinary/cloudinary.service"
import type { ICloudinaryService } from "./cloudinary/cloudinary.types"
import { GoogleMapsService } from "./google/google-map.service"
import type { IGoogleMapsService } from "./google/google-map.type"

export const AdaptersModule = new ContainerModule((bind) => {
	bind<IGoogleMapsService>(ADAPTER_TYPES.GoogleMapsService).to(GoogleMapsService)
	bind<IAwsRekognitionService>(ADAPTER_TYPES.AwsRekognitionService).to(
		AwsRekognitionService,
	)
	bind<IAnchorApiSdk>(ADAPTER_TYPES.AnchorApiSdk).to(AnchorApiSdkService)
	bind<ICloudinaryService>(ADAPTER_TYPES.CloudinaryService).toDynamicValue(() => {
		return new CloudinaryService(cloudinaryConfig)
	})
})
