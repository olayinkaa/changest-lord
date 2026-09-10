import { ContainerModule } from "inversify"
import { TransferController } from "./transfer.controller"
import { TransferRepository } from "./transfer.repository"
import { TransferService } from "./transfer.service"
import { type ITransferRepository, type ITransferService, TRANSFER_TYPES } from "./transfer.types"

export const TransferModule = new ContainerModule((bind) => {
	bind<ITransferService>(TRANSFER_TYPES.TransferService).to(TransferService)
	bind<ITransferRepository>(TRANSFER_TYPES.TransferRepository).to(TransferRepository)
	bind(TransferController).toSelf()
})
