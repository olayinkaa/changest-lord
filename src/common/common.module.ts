import { ContainerModule } from "inversify"
import { ChargeConfigService } from "./charge/charge.service"
import { CHARGE_TYPES, type IChargeConfigService } from "./charge/charge.type"
import { UtilityService } from "./utility/utility.service"
import { type IUtilityService, UTILITY_TYPES } from "./utility/utility.type"

export const CommonModule = new ContainerModule((bind) => {
	bind<IUtilityService>(UTILITY_TYPES.Service).to(UtilityService)
	bind<IChargeConfigService>(CHARGE_TYPES.Service).to(ChargeConfigService)
})
