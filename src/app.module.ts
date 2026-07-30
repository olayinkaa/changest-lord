import { AdaptersModule } from "./adapters/adapters.module"
import { LoggerModule } from "./config/pino-logger"
import { AddressModule } from "./modules/address/address.module"
import { UserModule } from "./modules/user/user.module"

const AppModules = [UserModule, LoggerModule, AdaptersModule, AddressModule]

export default AppModules
