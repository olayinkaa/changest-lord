import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import type pino from "pino"
import { validateSchema } from "@/core/middleware/validate-schema"
import { TYPES } from "@/types/di-types"
import { UserRequest } from "./user.dto"

@controller("/users")
export class UserController {
	constructor(@inject(TYPES.Logger) private logger: pino.Logger) {}

	@httpGet("/")
	public async getUsers() {
		this.logger.info("Accessing user endpoints")
		return [
			{ email: "john@example.com", id: 1, name: "John Doe" },
			{ email: "jane@example.com", id: 2, name: "Jane Smith" },
		]
	}

	@httpPost("/")
	@validateSchema(UserRequest)
	public async createUser(@requestBody() body: UserRequest) {
		return body
	}

	@httpPost("/validate")
	@validateSchema(UserRequest)
	public async createU(@requestBody() body: UserRequest) {
		return body
	}
}
