export const NIN_TYPES = {
	Service: Symbol.for("NinService"),
	Repository: Symbol.for("NinRepository"),
}

export interface INinService {
	validateNin(userId: string, bvn: string): Promise<any>
	getAllCachedNins(): Promise<any[]>
	getCachedNinByID(id: string): Promise<any>
}

export type INinRepository = {
	findNinRecordLocally(nin: string): Promise<any | null>
	saveNinRecordLocally(data: {
		nin: string
		firstName?: string
		lastName?: string
		dob?: string
		phone?: string
		image?: string
	}): Promise<any>
	getAllCachedNins(): Promise<any[]>
	findCachedNinByID(id: string): Promise<any>
}
