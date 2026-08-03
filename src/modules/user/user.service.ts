import { inject, injectable } from "inversify"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@injectable()
export class UserService implements IUserService {
	livenessRedirectUrl: string = "myChange://"

	constructor(
		@inject(USER_TYPES.Repository)
		private userRepository: IUserRepository,
	) {}

	async getAllUsers() {
		return this.userRepository.findAllWithKycAndBusiness()
	}

	async getUser(id: string) {
		return this.userRepository.findUser(id)
	}
}
