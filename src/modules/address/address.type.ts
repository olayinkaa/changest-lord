export const ADDRESS_TYPES = {
	Service: Symbol.for("AddressService"),
}

export interface IAddressService {
	getLocationAddress(search: string): any
}
