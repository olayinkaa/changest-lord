import { inject, injectable } from "inversify"
import { type ILedgerRepository, type ILedgerService, LEDGER_TYPES } from "./ledger.types"

@injectable()
export class LedgerService implements ILedgerService {
	constructor(
		@inject(LEDGER_TYPES.Repository)
		private ledgerRepo: ILedgerRepository,
	) {}

	public async createTransaction(data: any) {
		return this.ledgerRepo.createTransaction(data)
	}

	public async createEntry(data: any) {
		return this.ledgerRepo.createEntry(data)
	}
}
