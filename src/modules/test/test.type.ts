export const TEST_TYPES = {
	Service: Symbol.for("TestService"),
}

export interface IAddress {
	place_id: 374537691
	licence: string
	osm_type: string
	osm_id: number
	lat: string
	lon: string
	class: string
	type: string
	place_rank: number
	importance: number
	addresstype: string
	name: string
	display_name: string
	address: {
		neighbourhood: string
		town: string
		county: string
		state: string
		"ISO3166-2-lvl4": string
		postcode: string
		country: string
		country_code: string
	}
	boundingbox: string[]
}

type TGetLocationAddress = {
	placeId: string
	description: string
	mainText?: string
	secondaryText?: string
}

export interface ITestService {
	getLocationAddress(search: string): Promise<TGetLocationAddress[]>
}
