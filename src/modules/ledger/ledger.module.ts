import { ContainerModule } from "inversify"
import { LedgerRepository } from "./ledger.repository"
import { LedgerService } from "./ledger.service"
import { type ILedgerRepository, type ILedgerService, LEDGER_TYPES } from "./ledger.types"

export const LedgerModule = new ContainerModule((bind) => {
	bind<ILedgerService>(LEDGER_TYPES.Service).to(LedgerService)
	bind<ILedgerRepository>(LEDGER_TYPES.Repository).to(LedgerRepository)
})
