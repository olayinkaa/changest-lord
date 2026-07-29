import { ContainerModule } from "inversify"
import { GoogleMapsService } from "./google/google-map.service"
import { TYPES } from "./infrastructure.token"

export const InfrastructureModule = new ContainerModule((bind) => {
	bind<GoogleMapsService>(TYPES.GoogleMapsService).to(GoogleMapsService)
})
