export interface YouVerifyBvnResponse {
	provider: "youverify"
	data: {
		id: string
		parentId: string | null
		status: string // e.g., "found"
		reason: string | null
		firstName: string
		middleName: string | null
		lastName: string
		image: string // Base64 or image url depending on configuration
		dateOfBirth?: string
		phoneNumber1?: string
		email?: string
		gender?: string
		enrollmentBank?: string
		enrollmentBranch?: string
	}
}

export interface YouVerifyNinResponse {
	provider: "youverify"
	data: {
		firstName: string
		lastName: string
		dateOfBirth: string
		phoneNumber: string
		image: string // Base64
	}
}
