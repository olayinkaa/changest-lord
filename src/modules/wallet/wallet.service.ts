import { inject, injectable } from "inversify"
import type { TopUpWalletDto } from "./wallet.dto"
import { type IWalletRepository, type IWalletService, WALLET_TYPES } from "./wallet.types"

@injectable()
export class WalletService implements IWalletService {
	constructor(
		@inject(WALLET_TYPES.Repository)
		private walletRepo: IWalletRepository,
	) {}

	public async getBalance(userId: string) {
		const wallet = await this.walletRepo.findByUserId(userId)
		if (!wallet) {
			// Auto-create wallet if it doesn't exist
			const newWallet = await this.walletRepo.createWallet(userId)
			return { balance: newWallet.balance, currency: newWallet.currency }
		}
		return { balance: wallet.balance, currency: wallet.currency }
	}

	public async topUp(body: TopUpWalletDto) {
		return this.walletRepo.topUp(body.userId, body.amount)
	}
}
