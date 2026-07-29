import { ContainerModule } from "inversify"
import { AddressController } from "./address.controller"
import { AddressService } from "./address.service"
import { ADDRESS_TYPES, type IAddressService } from "./address.type"

export const AddressModule = new ContainerModule((bind) => {
	bind<IAddressService>(ADDRESS_TYPES.Service).to(AddressService)
	bind(AddressController).toSelf()
})
