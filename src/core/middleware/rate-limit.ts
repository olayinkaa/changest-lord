import { rateLimit } from "express-rate-limit"
import { withMiddleware } from "inversify-express-utils"
import Redis from "ioredis"
import RedisStore from "rate-limit-redis"
import { config } from "@/config/env"
import { ApiResponse } from "@/utils/http-response"

const redisClient = new Redis(config.REDIS_URL)

export function loginRateLimit() {
	const limiter = rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		limit: 5, // Limit each IP to 5 login requests per windowMs
		standardHeaders: "draft-7",
		legacyHeaders: false,
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

	return withMiddleware(limiter)
}
