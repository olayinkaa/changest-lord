import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpDelete,
	httpGet,
	httpPost,
	next,
	principal,
	queryParam,
	requestParam,
} from "inversify-express-utils"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsSesService } from "@/adapters/aws-ses/aws-ses.types"
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
		@inject(ADAPTER_TYPES.AwsSesService) private awsSesService: IAwsSesService,
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

	@httpDelete("/:id")
	public async deleteUser(@requestParam("id") id: string, @next() nxt: NextFunction) {
		try {
			const user = await this.userService.deleteUser(id)
			return this.json(ApiResponse.success(user), 200)
		} catch (error) {
			nxt(error)
		}
	}
	//
	@httpPost("/email")
	public async sendEmail(@next() nxt: NextFunction) {
		try {
			const result = await this.awsSesService.sendEmail({
				fromEmail: "olayinka@borgestech.co",
				to: "ibrahimolayinkaa@gmail.com",
				subject: "Testing for real subject",
				textBody: "This is a test email sent from AWS SES.",
				htmlBody:
					"<h1>Test Email</h1><p>If you see this, your AWS SES setup is working!</p>",
			})
			return result
		} catch (error) {
			nxt(error)
		}
	}
}
