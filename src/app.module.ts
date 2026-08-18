import { AdaptersModule } from "./adapters/adapters.module"
import { LoggerModule } from "./config/pino-logger"
import { AddressModule } from "./modules/address/address.module"
import { AuthModule } from "./modules/auth/auth.module"
import { BusinessTypeModule } from "./modules/business-type/business-type.module"
import { KycModule } from "./modules/kyc/kyc.module"
import { LivenessModule } from "./modules/liveness/liveness.module"
import { OnboardingModule } from "./modules/onboarding/onboarding.module"
import { UserModule } from "./modules/user/user.module"

const AppModules = [
	AuthModule,
	UserModule,
	LoggerModule,
	AdaptersModule,
	AddressModule,
	BusinessTypeModule,
	LivenessModule,
	OnboardingModule,
	KycModule,
]

export default AppModules
