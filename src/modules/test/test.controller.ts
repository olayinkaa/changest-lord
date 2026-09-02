import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	next,
	queryParam,
} from "inversify-express-utils"
import { ApiResponse } from "@/utils/http-response"
import { type ITestService, TEST_TYPES } from "./test.type"

@controller("/test-address")
export class TestController extends BaseHttpController {
	constructor(
		@inject(TEST_TYPES.Service)
		private readonly _addressService: ITestService,
	) {
		super()
	}

	@httpGet("/autocomplete")
	async getPredictions(@queryParam("search") search: string, @next() nxt: NextFunction) {
		try {
			const data = await this._addressService.getLocationAddress(search)
			return this.json(ApiResponse.success(data), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
