import type { AxiosResponse } from "axios"
import type { JwtPayload } from "jsonwebtoken"

export type ApiResponse<T = any> = AxiosResponse<T>

export interface PaginatedResult<T> {
	content: T[]
	total: number
}

export interface PaginatedResponse<T> {
	content: T[]
	page: number
	size: number
	totalPages: number
	totalElements: number
}

export interface AuthJwtPayload extends JwtPayload, IAuthUser {}
