import type { AxiosResponse } from "axios"

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
