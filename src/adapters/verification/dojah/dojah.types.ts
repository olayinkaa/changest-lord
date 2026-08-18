export interface IDojahBvnFullResponse {
	entity: {
		bvn: string
		first_name: string
		last_name: string
		middle_name: string
		gender: string
		date_of_birth: string
		phone_number1: string
		image: string // Base64 Image
		phone_number2: string
	}
}

export interface IDojahBvnAdvanceResponse {
	entity: {
		bvn: string
		first_name: string
		last_name: string
		middle_name: string
		gender: string
		date_of_birth: string
		phone_number1: string
		image: string
		email: string
		enrollment_bank: string
		enrollment_branch: string
		level_of_account: string
		lga_of_origin: string
		lga_of_residence: string
		marital_status: string
		nationality: string
		phone_number2: string
		state_of_origin: string
		state_of_residence: string
		title: string
		watch_listed: string
	}
}
