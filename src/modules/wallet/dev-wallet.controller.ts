import { inject } from "inversify"
import { controller, httpPost, requestBody } from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { TopUpWalletDto } from "./wallet.dto"
import { type IWalletService, WALLET_TYPES } from "./wallet.types"

@controller("/wallet")
export class DevWalletController {
	constructor(@inject(WALLET_TYPES.Service) private walletService: IWalletService) {}

	@httpPost("/test-topup")
	@validateSchema(TopUpWalletDto)
	public async topUp(@requestBody() body: TopUpWalletDto) {
		const result = await this.walletService.topUp(body)
		return ApiResponse.success({
			message: "Wallet topped up successfully for testing",
			newBalance: result.balance,
		})
	}

	@httpPost("/create/test")
	public async createWallet(@requestBody() body: { userId: string }) {
		const result = await this.walletService.createWalletForUser(body.userId)
		return ApiResponse.success(result)
	}
}
