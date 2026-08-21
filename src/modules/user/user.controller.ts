import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	queryParam,
	requestParam,
} from "inversify-express-utils"
import { validateQuery } from "@/core/middleware/validate-query"
import { ApiResponse } from "@/utils/http-response.js"
import { UserQueryDto } from "./user.dto"
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

	@httpGet("/", validateQuery(UserQueryDto))
	public async getUsers(@queryParam() query: UserQueryDto) {
		const users = await this.userService.getAllUsers(query)
		return this.json(ApiResponse.success(users), 200)
	}

	@httpGet("/:id")
	public async getUser(@requestParam("id") id: string) {
		const user = await this.userService.getUser(id)
		return this.json(ApiResponse.success(user), 200)
	}
}
