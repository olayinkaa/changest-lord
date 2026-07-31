import type { NextFunction } from "express"
import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpGet,
	httpPost,
	next,
	requestBody,
	requestParam,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { InitiateLivenessRequest } from "./liveness.dto"
import { type ILiveness, LIVENESS_TYPES } from "./liveness.type"

@controller("/liveness")
export class LivenessController extends BaseHttpController {
	constructor(
		@inject(LIVENESS_TYPES.Service)
		private readonly livenessService: ILiveness,
	) {
		super()
	}

	@httpPost("/start-session")
	@validateSchema(InitiateLivenessRequest)
	public async startLivenessSession(
		@requestBody() body: InitiateLivenessRequest,
		@next() nxt: NextFunction,
	) {
		try {
			const result = await this.livenessService.initiateLivenessSession(body)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	@httpGet("/get-result/:sessionId")
	public async getLivenessSessionResult(
		@requestParam("sessionId") sessionId: string,
		@next() nxt: NextFunction,
	) {
		try {
			const result = await this.livenessService.getLivenessSessionResult(sessionId)
			return this.json(ApiResponse.success(result))
		} catch (error) {
			nxt(error)
		}
	}

	//end here
}
