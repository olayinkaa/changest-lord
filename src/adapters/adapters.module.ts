import { ContainerModule } from "inversify"
import { ADAPTER_TYPES } from "./adapters.types"
import { GoogleMapsService } from "./google/google-map.service"
import type { IGoogleMapsService } from "./google/google-map.type"

export const AdaptersModule = new ContainerModule((bind) => {
	bind<IGoogleMapsService>(ADAPTER_TYPES.GoogleMapsService).to(GoogleMapsService)
})
