import { ContainerModule } from "inversify"
import { WORKER_PROCESSOR_TAG } from "@/core/queue/worker.bootstrap"
import { SettlementModule } from "@/modules/settlement/settlement.module"
import { SettlementWorker } from "./settlement.worker"

export const SettlementWorkerModule = new ContainerModule((bind) => {
	bind(WORKER_PROCESSOR_TAG).to(SettlementWorker)
})

export const SettlementWorkerContainerModules = [SettlementModule, SettlementWorkerModule]
