import { ContainerModule } from "inversify"
import { AdaptersModule } from "@/adapters/adapters.module"
import { EmailModule } from "@/modules/email/email.module"
import { EmailProcessor } from "@/modules/email/email.processor"
import { WORKER_PROCESSOR_TAG } from "./worker.bootstrap"

// Each processor binds itself under the shared multi-inject tag so
// WorkerBootstrap.start() can resolveAll and start them all.
const WorkerBindings = new ContainerModule((bind) => {
	bind(WORKER_PROCESSOR_TAG).to(EmailProcessor)
})

// Worker loads: adapters (Redis + SES), email module (IEmailSender binding),
// and WorkerBindings (processor). The QueueService binding is intentionally
// NOT loaded here — the worker never publishes jobs.
export const WorkerContainerModules = [
	AdaptersModule,
	EmailModule,
	WorkerBindings,
] as const

export { WORKER_PROCESSOR_TAG }
