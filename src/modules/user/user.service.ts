import { plainToInstance } from "class-transformer"
import { inject, injectable } from "inversify"
import type { PaginatedResponse } from "@/types/base"
import { type UserQueryDto, UserResponseDto } from "./user.dto"
import type { IUserRepository, IUserService } from "./user.types"
import { USER_TYPES } from "./user.types"

@injectable()
export class UserService implements IUserService {
	constructor(
		@inject(USER_TYPES.Repository)
		private userRepository: IUserRepository,
	) {}

	async getAllUsers(query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
		const { content, total } = await this.userRepository.findAll(query)
		const sanitizedResult = plainToInstance(UserResponseDto, content, {
			excludeExtraneousValues: true,
		})
		return {
			content: sanitizedResult,
			page: query.page,
			size: query.size,
			totalPages: Math.ceil(total / query.size),
			totalElements: total,
		}
	}

	async getUser(id: string) {
		const result = await this.userRepository.findUser(id)
		const sanitizedResult = plainToInstance(UserResponseDto, result, {
			excludeExtraneousValues: true,
		})
		return sanitizedResult
	}
}
