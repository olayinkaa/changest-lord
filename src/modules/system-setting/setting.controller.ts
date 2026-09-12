import { inject } from "inversify"
import { BaseHttpController, controller, httpGet, httpPatch, requestBody, requestParam } from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { UpdateSettingDto } from "./setting.dto"
import type { SettingService } from "./setting.service"
import { SETTING_TYPES } from "./setting.type"

@controller("/system/settings")
export class SettingController extends BaseHttpController {
	constructor(
		@inject(SETTING_TYPES.Service)
		private readonly settingService: SettingService,
	) {
		super()
	}

	@httpGet("/")
	public async getAllSettings() {
		const settings = await this.settingService.getAllSettings()
		return ApiResponse.success(settings)
	}
	@httpPatch("/:key")
	@validateSchema(UpdateSettingDto)
	public async updateSetting(@requestParam("key") key: string, @requestBody() body: UpdateSettingDto) {
		const updated = await this.settingService.updateSetting(key, body.value)
		return ApiResponse.success(updated)
	}
}
