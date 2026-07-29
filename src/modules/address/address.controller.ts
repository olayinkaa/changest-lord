import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	next,
	queryParam,
} from "inversify-express-utils"
import { ADDRESS_TYPES, type IAddressService } from "./address.type"

@controller("/address")
export class AddressController extends BaseHttpController {
	constructor(
		@inject(ADDRESS_TYPES.Service)
		private _addressService: IAddressService,
	) {
		super()
	}

	@httpGet("/predictions")
	async getPredictions(@queryParam("search") search: string, @next() nt: NextFunction) {
		try {
			const result = this._addressService.getLocationAddress(search)
			return result
		} catch (error) {
			nt(error)
		}
	}
}
