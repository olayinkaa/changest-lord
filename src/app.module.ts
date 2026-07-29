import { LoggerModule } from "./config/pino-logger"
import { InfrastructureModule } from "./infrastructure/ infrastructure.module"
import { AddressModule } from "./modules/address/address.module"
import { UserModule } from "./modules/user/user.module"

const AppModules = [UserModule, LoggerModule, InfrastructureModule, AddressModule]

export default AppModules
