// Each processor binds itself under the shared multi-inject tag so

import { ContainerModule } from "inversify"
import { AdaptersModule } from "@/adapters/adapters.module"
import { WORKER_PROCESSOR_TAG } from "@/core/bullmq/worker.bootstrap"
import { CronModule } from "@/core/cron/cron.module"
import { SettlementModule } from "../settlement/settlement.module"
import { EmailModule } from "./email/email.module"
import { EmailProcessor } from "./email/email.processor"
import { SettlementWorker } from "./settlement/settlement.worker"
import { BankTransferWorker } from "./transfer/bank-transfer.worker"
import { TransferWorkerModule } from "./transfer/transfer.worker.module"
import { WebhookWorker } from "./webhook/webhook.worker"

// WorkerBootstrap.start() can resolveAll and start them all.
export const WorkerBindings = new ContainerModule((bind) => {
	bind(WORKER_PROCESSOR_TAG).to(EmailProcessor)
	bind(WORKER_PROCESSOR_TAG).to(BankTransferWorker)
	bind(WORKER_PROCESSOR_TAG).to(SettlementWorker)
	bind(WORKER_PROCESSOR_TAG).to(WebhookWorker)
})

// Worker loads: adapters (Redis + SES), email module (IEmailSender binding),
// and WorkerBindings (processor). The QueueService binding is intentionally
// NOT loaded here — the worker never publishes jobs.
export const WorkerContainerModules = [
	AdaptersModule,
	EmailModule,
	TransferWorkerModule,
	WorkerBindings,
	CronModule,
	SettlementModule,
] as const

export type { WORKER_PROCESSOR_TAG }
