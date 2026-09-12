export interface createStaticVirtualAccountPayload {
	firstName: string
	lastName: string
	bvn: string
	dateOfBirth?: string
	customerEmail: string
	reference: string
	phoneNumber: string
}

export interface IStaticVirtualAccountResponse {
	status: true
	message: string
	data: {
		id: string
		createdAt: string
		updatedAt: string
		currency: "ngn"
		customerId: string
		accountName: string
		reference: string
		status: "active"
		bankName: string
		accountNumber: string
		depositInstructions: {
			accountName: string
			accountNumber: string
			bankName: string
		}
		bank: "providus" | "safehaven"
		type: "BANK"
	}
}

export interface IBrailsService {
	createStaticVirtualAccount(payload: createStaticVirtualAccountPayload): Promise<any>
}
