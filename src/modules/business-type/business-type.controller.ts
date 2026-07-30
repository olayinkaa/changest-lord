import { inject } from "inversify"
import {
	BaseHttpController,
	controller,
	httpDelete,
	httpGet,
	httpPost,
	httpPut,
	requestBody,
	requestParam,
} from "inversify-express-utils"
import { validateSchema } from "@/core/middleware/validate-schema"
import { ApiResponse } from "@/utils/http-response"
import { CreateBusinessTypeDto, UpdateBusinessTypeDto } from "./business-type.dto"
import { type IBusinessTypeService, TYPES } from "./business-type.types"

@controller("/business-types")
export class BusinessTypeController extends BaseHttpController {
	constructor(
		@inject(TYPES.BusinessTypeService)
		private readonly businessService: IBusinessTypeService,
	) {
		super()
	}

	@httpGet("/")
	async getAll() {
		const result = await this.businessService.getAllBusinessTypes()
		return this.json(ApiResponse.success(result))
	}

	@httpPost("/")
	@validateSchema(CreateBusinessTypeDto)
	async create(@requestBody() body: CreateBusinessTypeDto) {
		const result = await this.businessService.createBusinessType(body)
		return this.json(ApiResponse.success(result), 201)
	}

	@httpGet("/:id")
	async getOne(@requestParam("id") id: string) {
		const result = await this.businessService.getBusinessTypeById(id)
		return ApiResponse.success(result)
	}

	@httpPut("/:id")
	@validateSchema(UpdateBusinessTypeDto)
	async update(
		@requestBody() body: UpdateBusinessTypeDto,
		@requestParam("id") id: string,
	) {
		const result = await this.businessService.updateBusinessType(id, body)
		return this.json(ApiResponse.success(result))
	}

	@httpDelete("/:id")
	async delete(@requestParam("id") id: string) {
		const result = await this.businessService.deleteBusinessType(id)
		return this.json(ApiResponse.success(result, "Record Sucessfully Deleted"))
	}
}
