import type { Request, Response } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	principal,
	request,
	response,
} from "inversify-express-utils"
import { AuthGuard } from "@/core/guards/auth.guard"
import type { UserPrincipal } from "@/providers/user-principal"
import type { ISseService } from "./sse.types"
import { SSE_TYPES } from "./sse.types"

@controller("/sse")
export class SseController extends BaseHttpController {
	constructor(@inject(SSE_TYPES.Service) private sseService: ISseService) {
		super()
	}

	@httpGet("/events")
	@AuthGuard()
	public async events(
		@request() req: Request,
		@response() res: Response,
		@principal() authUser: UserPrincipal,
	): Promise<void> {
		const userId = authUser.details.id
		await this.sseService.handleConnection(req, res, userId)
	}
}
