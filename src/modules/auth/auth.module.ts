import { ContainerModule } from "inversify"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { TYPES } from "./auth.types"
import { AuthUtils } from "./auth-utils.service"

export const AuthModule = new ContainerModule((bind) => {
	bind(TYPES.AuthUtils).to(AuthUtils)
	bind(TYPES.AuthService).to(AuthService)
	bind(AuthController).toSelf()
})

//bind(TYPES.AuthService).to(AuthService).inSingletonScope();
