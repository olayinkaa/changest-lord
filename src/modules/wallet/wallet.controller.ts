import { inject } from "inversify"
import { controller, httpGet, httpPost, principal, queryParam } from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import type { UserPrincipal } from "@/providers/user-principal"
import { ApiResponse } from "@/utils/http-response"
import { type IWalletService, WALLET_TYPES } from "./wallet.types"

@controller("/wallet")
@AuthGuard()
export class WalletController {
	constructor(@inject(WALLET_TYPES.Service) private walletService: IWalletService) {}

	@httpGet("/balance")
	public async getBalance(@principal() authUser: UserPrincipal) {
		const userId = authUser.details?.id
		const result = await this.walletService.getBalance(userId)
		return ApiResponse.success(result)
	}

	@httpGet("/transactions")
	public async getTransactions(@principal() authUser: UserPrincipal) {
		const userId = authUser.details?.id
		const result = await this.walletService.getTransactionHistory(userId)
		return ApiResponse.success(result)
	}

	@httpGet("/recent-transactions")
	public async getRecent(@principal() authUser: UserPrincipal, @queryParam("limit") limit?: string) {
		const userId = authUser.details?.id
		const numLimit = limit ? parseInt(limit, 10) : 5
		const validatedLimit = [5, 10].includes(numLimit) ? numLimit : 5
		const result = await this.walletService.getRecentTransactions(userId, validatedLimit)
		return ApiResponse.success(result)
	}

	@httpPost("/create")
	public async createWallet(@principal() authUser: UserPrincipal) {
		const userId = authUser.details?.id
		const result = await this.walletService.createWalletForUser(userId)
		return ApiResponse.success(result)
	}
}
