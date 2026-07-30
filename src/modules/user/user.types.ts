export const USER_TYPES = {
	Service: Symbol.for("UserService"),
	Repository: Symbol.for("UserRepository"),
}

export interface IUserRepository {
	findByPhoneWithKyc(
		phone: string,
	): Promise<{ id: string; kyc: { completedProfile: boolean } | null } | null>
}

export interface IUserService {
	validatePhone(phone: string): Promise<{ phone: string; available: boolean }>
}
