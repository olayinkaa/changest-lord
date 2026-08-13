import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	requestParam,
} from "inversify-express-utils"
import { ApiResponse } from "@/utils/http-response.js"
import type { IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@controller("/users")
export class UserController extends BaseHttpController {
	constructor(
		@inject(USER_TYPES.Service)
		private userService: IUserService,
	) {
		super()
	}

	@httpGet("/")
	public async getUsers() {
		const users = await this.userService.getAllUsers()
		return this.json(ApiResponse.success(users), 200)
	}

	@httpGet("/:id")
	public async getUser(@requestParam("id") id: string) {
		const user = await this.userService.getUser(id)
		return this.json(ApiResponse.success(user), 200)
	}
}
