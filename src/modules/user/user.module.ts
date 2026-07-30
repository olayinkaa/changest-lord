import { ContainerModule } from "inversify"
import { UserController } from "./user.controller"
import { UserRepository } from "./user.repository"
import { UserService } from "./user.service"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

export const UserModule = new ContainerModule((bind) => {
	bind<IUserRepository>(USER_TYPES.Repository).to(UserRepository)
	bind<IUserService>(USER_TYPES.Service).to(UserService)
	bind(UserController).toSelf()
})
