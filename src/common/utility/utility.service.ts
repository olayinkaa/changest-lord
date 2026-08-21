import { inject, injectable } from "inversify"
import { type IUserRepository, USER_TYPES } from "@/modules/user/user.types"
import type { IUtilityService } from "./utility.type"

@injectable()
export class UtilityService implements IUtilityService {
	constructor(
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
	) {}

	async generateUniqueUserId5(): Promise<string> {
		let isUnique = false
		let randomUserId5 = ""

		while (!isUnique) {
			// Generate a random number strictly between 10000 and 99999 (always 5 digits, no leading zeros)
			const randomNumber = Math.floor(Math.random() * 90000) + 10000
			randomUserId5 = randomNumber.toString()

			const existing = await this.userRepo.findByUserId5(randomUserId5)
			if (!existing) {
				isUnique = true
			}
		}

		return randomUserId5
	}
}
