import { inject } from "inversify"
import { controller, httpGet, principal } from "inversify-express-utils"
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
}
