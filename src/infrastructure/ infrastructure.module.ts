import { ContainerModule } from "inversify"
import { GoogleMapsService } from "./google/google-map.service"
import { TYPES } from "./infrastructure.types"

export const InfrastructureModule = new ContainerModule((bind) => {
	bind<GoogleMapsService>(TYPES.GoogleMapsService).to(GoogleMapsService)
})
