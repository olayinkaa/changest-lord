import { ContainerModule } from "inversify"
import { DevWalletController } from "./dev-wallet.controller"
import { WalletController } from "./wallet.controller"
import { WalletRepository } from "./wallet.repository"
import { WalletService } from "./wallet.service"
import { type IWalletRepository, type IWalletService, WALLET_TYPES } from "./wallet.types"

export const WalletModule = new ContainerModule((bind) => {
	bind<IWalletService>(WALLET_TYPES.Service).to(WalletService)
	bind<IWalletRepository>(WALLET_TYPES.Repository).to(WalletRepository)
	bind(WalletController).toSelf()

	if (process.env.NODE_ENV !== "production") {
		bind(DevWalletController).toSelf()
	}
})
