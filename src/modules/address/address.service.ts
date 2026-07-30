import { inject, injectable } from "inversify"
import { BadRequestException } from "@/core/errors/exceptions"
import type { IGoogleMapsService } from "@/infrastructure/google/google-map.type"
import { INFRA_TYPES } from "@/infrastructure/infrastructure.types"
import type { IAddressService, TGetLocationAddress } from "./address.type"

@injectable()
export class AddressService implements IAddressService {
	constructor(
		@inject(INFRA_TYPES.GoogleMapsService)
		private googleMapsService: IGoogleMapsService,
	) {}

	async getLocationAddress(search: string): Promise<TGetLocationAddress[]> {
		if (!search) {
			throw new BadRequestException("Search query is missing")
		}
		const result = await this.googleMapsService.getPlacePredictions(search)
		return result?.predictions.map((item) => ({
			placeId: item.place_id,
			description: item.description,
			mainText: item.structured_formatting?.main_text,
			secondaryText: item.structured_formatting?.secondary_text,
		}))
	}

	async getLocationGeometry(placeId: string) {
		if (!placeId) {
			throw new BadRequestException("The 'placeId' query parameter is required")
		}
		const selectedField = "geometry"
		const result = await this.googleMapsService.getPlaceDetails(placeId, selectedField)
		return result.result.geometry
	}
}
