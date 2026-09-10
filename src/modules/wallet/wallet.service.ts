import { inject, injectable } from "inversify"
import { BadRequestException } from "@/core/errors/exceptions"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import type { TopUpWalletDto } from "./wallet.dto"
import { type IWalletRepository, type IWalletService, WALLET_TYPES } from "./wallet.types"

@injectable()
export class WalletService implements IWalletService {
	constructor(
		@inject(WALLET_TYPES.Repository)
		private walletRepo: IWalletRepository,
		@inject(USER_TYPES.Repository)
		private userRepo: IUserRepository,
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
		const { identifier, amount } = body

		// 1. Resolve the UUID from phone or userId5
		let user = await this.userRepo.findUserByPhone(identifier)
		if (!user) {
			user = await this.userRepo.findByUserId5(identifier)
		}

		if (!user) {
			throw new BadRequestException(`User not found with identifier: ${identifier}`)
		}

		// 2. Ensure wallet exists before topping up
		let wallet = await this.walletRepo.findByUserId(user.id)
		if (!wallet) {
			wallet = await this.walletRepo.createWallet(user.id)
		}

		return this.walletRepo.topUp(user.id, amount)
	}
}
