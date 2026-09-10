import { ContainerModule } from "inversify"
import { BankAdapter } from "@/adapters/payment/bank.adapter"
import { TransferRepository } from "@/modules/transfer/transfer.repository"
import { TRANSFER_TYPES } from "@/modules/transfer/transfer.types"
import { BankTransferWorker } from "./bank-transfer.worker"

export const TransferWorkerModule = new ContainerModule((bind) => {
	bind(BankTransferWorker).toSelf()

	// We bind these here to ensure the worker has its dependencies
	// if they aren't already in the worker container
	bind(TRANSFER_TYPES.BankAdapter).to(BankAdapter)
	bind(TRANSFER_TYPES.TransferRepository).to(TransferRepository)
})
