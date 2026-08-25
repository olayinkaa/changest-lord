import { inject, injectable } from "inversify"
import { type IKycRepository, type IKycService, KYC_TYPES } from "./kyc.types"

@injectable()
export class KycService implements IKycService {
	constructor(@inject(KYC_TYPES.Repository) private readonly kycRepo: IKycRepository) {}

	//
	async getAllKycRecords() {
		return this.kycRepo.getAllKycs()
	}
	//
}
