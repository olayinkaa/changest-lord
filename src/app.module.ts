import { LoggerModule } from "./config/pino-logger"
import { UserModule } from "./modules/user/user.module"

const AppModules = [UserModule, LoggerModule]

export default AppModules
