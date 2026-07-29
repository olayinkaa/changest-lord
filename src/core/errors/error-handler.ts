/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: false positive */
/** biome-ignore-all lint/suspicious/noExplicitAny: false positive */
import type { NextFunction, Request, Response } from "express"
import { pinoLogger } from "@/config/pino-logger"
import { HttpException } from "./exceptions"

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
	if (err instanceof HttpException) {
		return res.status(err.status).json({
			code: err.status,
			status: "error",
			message: err.message,
			data: err.data || undefined,
		})
	}

	pinoLogger.error({ err }, "An unhandled exception occurred within the routing stack")

	return res.status(500).json({
		status: "error",
		message: "Internal server error",
	})
}
