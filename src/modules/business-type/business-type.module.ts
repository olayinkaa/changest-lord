import { ContainerModule } from "inversify"
import { BusinessTypeController } from "./business-type.controller"
import { BusinessTypeRepository } from "./business-type.repository"
import { BusinessTypeService } from "./business-type.service"
import { TYPES } from "./business-type.types"

export const BusinessTypeModule = new ContainerModule((bind) => {
	bind(TYPES.BusinessTypeRepository).to(BusinessTypeRepository)
	bind(TYPES.BusinessTypeService).to(BusinessTypeService)
	bind(BusinessTypeController).toSelf()
})
