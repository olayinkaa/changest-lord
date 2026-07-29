import { ContainerModule } from "inversify"
import { UserController } from "./user.controller"

export const UserModule = new ContainerModule((bind) => {
	bind(UserController).toSelf()
})
