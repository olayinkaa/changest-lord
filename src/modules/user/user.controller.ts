import { Body, Controller, Get, Post } from "@inversifyjs/http-core"
import { ValidateStandardSchemaV1 } from "@inversifyjs/standard-schema-validation"
import { type userInputs, userSchema } from "./user.dto"

@Controller("/users")
export class UserController {
	@Get()
	// @StatusCode(HttpStatusCode.CREATED)
	public async getUsers(): Promise<any[]> {
		return [
			{ email: "john@example.com", id: 1, name: "John Doe" },
			{ email: "jane@example.com", id: 2, name: "Jane Smith" },
		]
	}

	@Post()
	public async createUser(
		@Body()
		@ValidateStandardSchemaV1(userSchema)
		user: userInputs,
	): Promise<userInputs> {
		return user
	}
}
