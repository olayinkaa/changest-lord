import { ContainerModule } from "inversify"
import { ADAPTER_TYPES } from "./adapters.types"
import { AnchorApiSdkService, type IAnchorApiSdk } from "./anchor-api-sdk/anchor.service"
import type { IAwsRekognitionService } from "./aws-rekognition/aws-rekogniction.type"
import { AwsRekognitionService } from "./aws-rekognition/aws-rekognition.service"
import { GoogleMapsService } from "./google/google-map.service"
import type { IGoogleMapsService } from "./google/google-map.type"

export const AdaptersModule = new ContainerModule((bind) => {
	bind<IGoogleMapsService>(ADAPTER_TYPES.GoogleMapsService).to(GoogleMapsService)
	bind<IAwsRekognitionService>(ADAPTER_TYPES.AwsRekognitionService).to(
		AwsRekognitionService,
	)
	bind<IAnchorApiSdk>(ADAPTER_TYPES.AnchorApiSdk).to(AnchorApiSdkService)
})
