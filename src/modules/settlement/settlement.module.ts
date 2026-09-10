import { ContainerModule } from "inversify"
import { type ISettlementService, SettlementServiceImpl } from "./settlement.service"
import { SETTLEMENT_TYPES } from "./settlement.types"

export const SettlementModule = new ContainerModule((bind) => {
	bind<ISettlementService>(SETTLEMENT_TYPES.SettlementService).to(SettlementServiceImpl)
})
