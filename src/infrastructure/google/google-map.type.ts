export interface IPlacePrediction {
	description: string
	matched_substrings: {
		length: number
		offset: number
	}[]
	place_id: string
	reference: string
	structured_formatting?: {
		main_text: string
		main_text_matched_substrings: {
			length: number
			offset: number
		}[]
		secondary_text: string
	}
	terms: {
		offset: number
		value: string
	}[]
	types: string[]
}

export interface IPlaceDetails {
	html_attributions: []
	result: Partial<{
		address_components: {
			long_name: string
			short_name: string
			types: string[]
		}[]
		adr_address: string
		formatted_address: string
		geometry: {
			location: {
				lat: 9.0097279
				lng: 7.4988615
			}
			viewport: {
				northeast: {
					lat: 9.010852030291503
					lng: 7.5007872
				}
				southwest: {
					lat: 9.008154069708498
					lng: 7.4970254
				}
			}
		}
		icon: string
		icon_background_color: string
		icon_mask_base_uri: string
		name: string
		place_id: string
		reference: string
		types: string[]
		url: string
		utc_offset: number
		vicinity: string
	}>
	status: "OK"
}

export interface IGoogleMapsService {
	getPlacePredictions(input: string): Promise<{ predictions: IPlacePrediction[] }>
	getPlaceDetails(placeId: string, fields?: string): Promise<IPlaceDetails>
}
