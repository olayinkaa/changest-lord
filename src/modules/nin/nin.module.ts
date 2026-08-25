import { ContainerModule } from "inversify"
import { NinRepository } from "./nin.repository"
import { NinService } from "./nin.service"
import { type INinRepository, type INinService, NIN_TYPES } from "./nin.types"

export const NinModule = new ContainerModule((bind) => {
	bind<INinService>(NIN_TYPES.Service).to(NinService)
	bind<INinRepository>(NIN_TYPES.Repository).to(NinRepository)
})
