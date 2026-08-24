export const KYC_TYPES = {
	Service: Symbol.for("KycService"),
	Repository: Symbol.for("KycRepository"),
}

export interface IKycService {
	validateBvn(userId: string, bvn: string): Promise<any>
	getAllCachedBvns(): Promise<any[]>
	getCachedBvnByID(id: string): Promise<any>
}

export type IKycRepository = {
	findBvnRecordLocally(bvn: string): Promise<any | null>
	saveBvnRecordLocally(data: {
		bvn: string
		firstName?: string
		lastName?: string
		dob?: string
		phone?: string
		image?: string
	}): Promise<any>
	getAllCachedBvns(): Promise<any[]>
	findCachedBvnByID(id: string): Promise<any>
}
