import axios, { type AxiosInstance } from "axios"
import { injectable } from "inversify"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { ApiResponse } from "@/types/base"
import type {
	IGoogleMapsService,
	IPlaceDetails,
	IPlacePrediction,
} from "./google-map.type"

const AUTOCOMPLETE_COUNTRY_RESTRICTION = "country:ng"

@injectable()
export class GoogleMapsService implements IGoogleMapsService {
	private readonly apiKey = config.GOOGLE_MAPS_API_KEY
	private readonly api: AxiosInstance

	constructor() {
		this.api = axios.create({
			baseURL: "https://maps.googleapis.com/maps/api",
		})
	}

	//   getPlacePredictions
	async getPlacePredictions(input: string) {
		try {
			const res: ApiResponse<{ predictions: IPlacePrediction[] }> = await this.api.get(
				"/place/autocomplete/json",
				{
					params: {
						input,
						key: this.apiKey,
						// types: "address",
						components: AUTOCOMPLETE_COUNTRY_RESTRICTION,
					},
				},
			)
			return res?.data
		} catch (e) {
			pinoLogger.error({ error: e }, "Error in fetching place predictions")
			throw e
		}
	}

	async getPlaceDetails(placeId: string, fields?: string) {
		const selectedFields = fields || undefined
		try {
			const res: ApiResponse<IPlaceDetails> = await this.api.get("/place/details/json", {
				params: {
					place_id: placeId,
					key: this.apiKey,
					fields: selectedFields,
					// fields: "formatted_address,geometry,address_component,place_id",
				},
			})
			return res.data
		} catch (e) {
			pinoLogger.error({ error: e }, "Error in fetching place details")
			throw e
		}
	}
}
