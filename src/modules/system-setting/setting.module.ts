import { ContainerModule } from "inversify"
import { SettingController } from "./setting.controller"
import { SettingRepository } from "./setting.repository"
import { SettingService } from "./setting.service"
import { SETTING_TYPES } from "./setting.type"

export const SettingModule = new ContainerModule((bind) => {
	bind(SETTING_TYPES.Repository).to(SettingRepository)
	bind(SETTING_TYPES.Service).to(SettingService)
	bind(SettingController).toSelf()
})
