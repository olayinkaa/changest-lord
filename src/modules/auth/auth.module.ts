import { ContainerModule } from "inversify"
import { TYPES } from "./auth.types"
import { AuthUtils } from "./auth-utils.service"

export const AuthModule = new ContainerModule((bind) => {
	bind(TYPES.AuthUtils).to(AuthUtils).inSingletonScope()
})
