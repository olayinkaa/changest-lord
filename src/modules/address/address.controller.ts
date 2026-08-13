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
import { ADDRESS_TYPES, type IAddressService } from "./address.type"

@controller("/address")
export class AddressController extends BaseHttpController {
	constructor(
		@inject(ADDRESS_TYPES.Service)
		private readonly _addressService: IAddressService,
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

	@httpGet("/geometry")
	async getGeometry(@queryParam("placeId") placeId: string, @next() nxt: NextFunction) {
		try {
			const data = await this._addressService.getLocationGeometry(placeId)
			return this.json(ApiResponse.success(data), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
