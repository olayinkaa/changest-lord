import { inject } from "inversify"
import { controller, httpGet, principal, queryParam, requestParam } from "inversify-express-utils"
import type { UserPrincipal } from "@/providers/user-principal"
import { ApiResponse } from "@/utils/http-response"
import { type ILedgerService, LEDGER_TYPES } from "./ledger.types"

@controller("/ledger")
export class LedgerController {
	constructor(
		@inject(LEDGER_TYPES.Service)
		private ledgerService: ILedgerService,
	) {}

	@httpGet("/transactions")
	public async getTransactions(@principal() authUser: UserPrincipal) {
		const userId = authUser.details?.id
		const result = await this.ledgerService.getTransactionHistory(userId)
		return ApiResponse.success(result)
	}

	@httpGet("/transaction/reference/:reference")
	public async getTransactionByReference(@requestParam("reference") reference: string) {
		const details = await this.ledgerService.getTransactionByReference(reference)
		return ApiResponse.success(details)
	}

	@httpGet("/transaction/entry/:id")
	public async getLedgerEntryDetails(@requestParam("id") id: string) {
		const details = await this.ledgerService.getLedgerEntryDetails(id)
		return ApiResponse.success(details)
	}

	@httpGet("/recent-transactions")
	public async getRecent(@principal() authUser: UserPrincipal, @queryParam("limit") limit?: string) {
		const userId = authUser.details?.id
		const numLimit = limit ? parseInt(limit, 10) : 5
		const validatedLimit = [5, 10].includes(numLimit) ? numLimit : 5
		const result = await this.ledgerService.getRecentTransactions(userId, validatedLimit)
		return ApiResponse.success(result)
	}
}
