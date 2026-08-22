import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	next,
	principal,
	queryParam,
	requestParam,
} from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import { validateQuery } from "@/core/middleware/validate-query"
import type { UserPrincipal } from "@/providers/user-principal"
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
	public async getUsers(@queryParam() query: UserQueryDto, @next() nxt: NextFunction) {
		try {
			const users = await this.userService.getAllUsers(query)
			return this.json(ApiResponse.success(users), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpGet("/me")
	@AuthGuard()
	public async getCurrentUser(
		@next() nxt: NextFunction,
		@principal() authUser: UserPrincipal,
	) {
		try {
			const user = await this.userService.getUser(authUser.details.id)
			return this.json(ApiResponse.success(user), 200)
		} catch (error) {
			nxt(error)
		}
	}

	@httpGet("/:id")
	@AuthGuard()
	public async getUser(@requestParam("id") id: string, @next() nxt: NextFunction) {
		try {
			const user = await this.userService.getUser(id)
			return this.json(ApiResponse.success(user), 200)
		} catch (error) {
			nxt(error)
		}
	}
}
