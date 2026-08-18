export const KYC_TYPES = {
	Service: Symbol.for("KycService"),
	Repository: Symbol.for("KycRepository"),
}

export interface IKycService {
	validateBVN(bvn: string): Promise<any>
}

export type IKycRepository = {}
