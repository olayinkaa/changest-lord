import { ContainerModule } from "inversify"
import { GoogleMapsService } from "./google/google-map.service"
import type { IGoogleMapsService } from "./google/google-map.type"
import { INFRA_TYPES } from "./infrastructure.types"

export const InfrastructureModule = new ContainerModule((bind) => {
	bind<IGoogleMapsService>(INFRA_TYPES.GoogleMapsService).to(GoogleMapsService)
})
