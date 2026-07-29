export interface IPlacePrediction {
	predictions: {
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
}

export interface IGoogleMapsService {
	getPlacePredictions(input: string): Promise<IPlacePrediction[]>
	getPlaceDetails(placeId: string): any
}
