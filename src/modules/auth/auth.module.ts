import { ContainerModule } from "inversify"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { AUTH_TYPES } from "./auth.types"
import { AuthUtils } from "./auth-utils.service"

export const AuthModule = new ContainerModule((bind) => {
	bind(AUTH_TYPES.AuthUtils).to(AuthUtils)
	bind(AUTH_TYPES.AuthService).to(AuthService)
	bind(AuthController).toSelf()
})

//bind(AUTH_TYPES.AuthService).to(AuthService).inSingletonScope();
