import { AdaptersModule } from "./adapters/adapters.module"
import { LoggerModule } from "./config/pino-logger"
import { AddressModule } from "./modules/address/address.module"
import { BusinessTypeModule } from "./modules/business-type/business-type.module"
import { LivenessModule } from "./modules/liveness/liveness.module"
import { OnboardingModule } from "./modules/onboarding/onboarding.module"
import { UserModule } from "./modules/user/user.module"

const AppModules = [
	UserModule,
	LoggerModule,
	AdaptersModule,
	AddressModule,
	BusinessTypeModule,
	OnboardingModule,
	LivenessModule,
]

export default AppModules
