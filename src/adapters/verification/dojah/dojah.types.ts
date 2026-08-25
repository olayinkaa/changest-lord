/**
 * =====================================
 *  BVN VERIFICATION
 * =====================================
 */
export interface IDojahBvnFullResponse {
	provider: "dojah"
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
	provider: "dojah"
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

/**
 * =====================================
 *  NIN VERIFICATION
 * =====================================
 */
export interface IDojahNinResponse {
	provider: "dojah"
	entity: {
		first_name: string
		last_name: string
		gender: string
		middle_name: string
		photo: string
		date_of_birth: string
		phone_number: string
		employment_status: string
		marital_status: string
	}
}

export interface IDojahNinFullResponse {
	provider: "dojah"
	entity: {
		nin: string
		first_name: string
		last_name: string
		middle_name: string
		date_of_birth: string
		phone_number: string
		photo: string
		gender: string
		birth_country: string
		birth_lga: string
		birth_state: string
		residence_address_line_1: string
		residence_status: string
		residence_town: string
		residence_lga: string
		residence_state: string
		origin_lga: string
		origin_place: string
		origin_state: string
		nok_first_name: string
		nok_middle_name: string
		nok_last_name: string
		nok_town: string
		nok_lga: string
		nok_address_line_1: string
	}
}
