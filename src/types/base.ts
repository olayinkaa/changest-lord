import type { AxiosResponse } from "axios"
import type { JwtPayload } from "jsonwebtoken"
import type { Prisma } from "@/generated/prisma/client"

export type Decimal = Prisma.Decimal

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
