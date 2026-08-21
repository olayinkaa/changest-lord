import { ContainerModule } from "inversify"
import { UtilityService } from "./utility.service"
import { type IUtilityService, UTILITY_TYPES } from "./utility.type"

export const UtilityModule = new ContainerModule((bind) => {
	bind<IUtilityService>(UTILITY_TYPES.Service).to(UtilityService)
})
