import { rateLimit } from "express-rate-limit"
import { withMiddleware } from "inversify-express-utils"
import Redis from "ioredis"
import RedisStore from "rate-limit-redis"
import { config } from "@/config/env"
import { ApiResponse } from "@/utils/http-response"

const redisClient = new Redis(config.REDIS_URL)

function createLimiter(options: any) {
	return rateLimit({
		...options,
		store: new RedisStore({
			sendCommand: async (...args: string[]) =>
				(await redisClient.call(...(args as [string, ...string[]]))) as any,
		}),
		handler: (_req, res, _next, options) => {
			res
				.status(options.statusCode)
				.json(ApiResponse.error(null, options.message, options.statusCode))
		},
	})
}

export function loginRateLimit() {
	const limiter = createLimiter({
		windowMs: 15 * 60 * 1000, // 15 minutes
		limit: 5, // Limit each IP to 5 login requests per windowMs
		standardHeaders: "draft-7",
		legacyHeaders: false,
	})

	return withMiddleware(limiter)
}

export function userRateLimit(limit: number = 100, windowMs: number = 60 * 1000) {
	const limiter = createLimiter({
		windowMs,
		limit,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		keyGenerator: (req: any) => {
			// Prioritize User ID if available (from auth middleware), fallback to IP
			return req.user?.id || req.ip
		},
	})

	return withMiddleware(limiter)
}
