import { AdaptersModule } from "./adapters/adapters.module"
import { UtilityModule } from "./common/utility/utility.module"
import { LoggerModule } from "./config/pino-logger"
import { QueueModule } from "./core/queue/queue.module"
import { AddressModule } from "./modules/address/address.module"
import { AuthModule } from "./modules/auth/auth.module"
import { BusinessTypeModule } from "./modules/business-type/business-type.module"
import { BvnModule } from "./modules/bvn/bvn.module"
import { FileModule } from "./modules/file/file.module"
import { KycModule } from "./modules/kyc/kyc.module"
import { LivenessModule } from "./modules/liveness/liveness.module"
import { NinModule } from "./modules/nin/nin.module"
import { OnboardingModule } from "./modules/onboarding/onboarding.module"
import { TestModule } from "./modules/test/test.module"
import { UserModule } from "./modules/user/user.module"
import { EmailModule } from "./modules/workers/email/email.module"

const AppModules = [
	AuthModule,
	UserModule,
	LoggerModule,
	AdaptersModule,
	QueueModule,
	EmailModule,
	AddressModule,
	BusinessTypeModule,
	LivenessModule,
	OnboardingModule,
	KycModule,
	UtilityModule,
	NinModule,
	BvnModule,
	FileModule,
	TestModule,
]

export default AppModules
