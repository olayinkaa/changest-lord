import { AdaptersModule } from "./adapters/adapters.module"
import { CommonModule } from "./common/common.module"
import { LoggerModule } from "./config/pino-logger"
import { QueueModule } from "./core/bullmq/queue.module"
import { AddressModule } from "./modules/address/address.module"
import { AuthModule } from "./modules/auth/auth.module"
import { BusinessTypeModule } from "./modules/business-type/business-type.module"
import { BvnModule } from "./modules/bvn/bvn.module"
import { FileModule } from "./modules/file/file.module"
import { KycModule } from "./modules/kyc/kyc.module"
import { LedgerModule } from "./modules/ledger/ledger.module"
import { LivenessModule } from "./modules/liveness/liveness.module"
import { NinModule } from "./modules/nin/nin.module"
import { OnboardingModule } from "./modules/onboarding/onboarding.module"
import { SettlementModule } from "./modules/settlement/settlement.module"
import { SseModule } from "./modules/sse/sse.module"
import { TestModule } from "./modules/test/test.module"
import { TransferModule } from "./modules/transfer/transfer.module"
import { UserModule } from "./modules/user/user.module"
import { WalletModule } from "./modules/wallet/wallet.module"
import { WebhookModule } from "./modules/webhook/webhook.module"
import { EmailModule } from "./modules/workers/email/email.module"

const AppModules = [
	AuthModule,
	UserModule,
	LoggerModule,
	AdaptersModule,
	QueueModule,
	EmailModule,
	SseModule,
	AddressModule,
	BusinessTypeModule,
	LivenessModule,
	OnboardingModule,
	KycModule,
	NinModule,
	BvnModule,
	FileModule,
	WebhookModule,
	TestModule,
	TransferModule,
	WalletModule,
	LedgerModule,
	SettlementModule,
	CommonModule,
]

export default AppModules
