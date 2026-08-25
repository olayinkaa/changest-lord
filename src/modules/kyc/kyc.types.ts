export const KYC_TYPES = {
	Service: Symbol.for("KycService"),
	Repository: Symbol.for("KycRepository"),
}

export interface IKycService {
	getAllKycRecords(): Promise<any[]>
}

export type IKycRepository = {
	getAllKycs(): Promise<any[]>
}
