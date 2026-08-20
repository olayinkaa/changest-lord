import { ContainerModule } from "inversify"
import { BusinessTypeController } from "./business-type.controller"
import { BusinessTypeRepository } from "./business-type.repository"
import { BusinessTypeService } from "./business-type.service"
import { BUSINESS_TYPES } from "./business-type.types"

export const BusinessTypeModule = new ContainerModule((bind) => {
	bind(BUSINESS_TYPES.Repository).to(BusinessTypeRepository)
	bind(BUSINESS_TYPES.Service).to(BusinessTypeService)
	bind(BusinessTypeController).toSelf()
})
