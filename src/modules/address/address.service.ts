import { inject, injectable } from "inversify"
import type { IGoogleMapsService } from "@/infrastructure/google/google-map.type"
import { TYPES } from "@/infrastructure/infrastructure.token"
import type { IAddressService } from "./address.type"

@injectable()
export class AddressService implements IAddressService {
	constructor(
		@inject(TYPES.GoogleMapsService)
		private googleMapsService: IGoogleMapsService,
	) {}

	async getLocationAddress(search: string) {
		const result = await this.googleMapsService.getPlacePredictions(search)
		return result
	}
}
