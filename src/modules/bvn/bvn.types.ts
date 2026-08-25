export const BVN_TYPES = {
	Service: Symbol.for("BvnService"),
	Repository: Symbol.for("BvnRepository"),
}

export interface IBvnService {
	validateBvn(userId: string, bvn: string): Promise<any>
	getAllCachedBvns(): Promise<any[]>
	getCachedBvnByID(id: string): Promise<any>
}

export type IBvnRepository = {
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
