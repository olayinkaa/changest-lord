export interface createStaticVirtualAccountPayload {
	firstName: string
	lastName: string
	bvn: string
	dateOfBirth?: string
	customerEmail: string
	reference: string
	phoneNumber: string
}

export interface IBrailsService {
	createStaticVirtualAccount(payload: createStaticVirtualAccountPayload): Promise<any>
}
