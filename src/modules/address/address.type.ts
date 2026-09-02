export const ADDRESS_TYPES = {
	Service: Symbol.for("AddressService"),
}

export type TGetLocationAddress = {
	placeId: string
	displayName: string
	mainText?: string
	secondaryText?: string
}

export interface IAddressService {
	getLocationAddress(search: string): Promise<TGetLocationAddress[]>
	getLocationGeometry(placeId: string): any
}
