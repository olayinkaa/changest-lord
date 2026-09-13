import type { NextFunction, Request, Response } from "express"
import { withMiddleware } from "inversify-express-utils"
import { pinoLogger } from "@/config/pino-logger"
import { prisma } from "@/core/database/db"
import { ForbiddenException } from "@/core/errors/exceptions"
import { hashApiKey } from "@/utils/crypto"

export function apiKeyGuard() {
	const middleware = async (req: Request, _: Response, next: NextFunction) => {
		try {
			const apiKey = req.headers["x-api-key"] as string

			if (!apiKey) {
				pinoLogger.warn({ headers: req.headers }, "Request missing x-api-key header")
				throw new ForbiddenException("API Key is missing")
			}

			const hashedKey = hashApiKey(apiKey)
			const keyRecord = await prisma.systemApiKey.findUnique({
				where: { keyHash: hashedKey },
			})

			if (!keyRecord?.isActive) {
				pinoLogger.warn({ apiKey: "REDACTED", clientIp: req.ip }, "Invalid or inactive API Key attempted")
				throw new ForbiddenException("Invalid or inactive API Key")
			}

			// IP Whitelisting Check
			if (keyRecord.allowedIps && keyRecord.allowedIps.length > 0) {
				const clientIp = req.ip || req.socket.remoteAddress
				if (!keyRecord.allowedIps.includes(clientIp as string)) {
					pinoLogger.warn(
						{
							clientIp,
							allowedIps: keyRecord.allowedIps,
							clientName: keyRecord.clientName,
						},
						"API Key used from non-whitelisted IP",
					)
					throw new ForbiddenException("Request origin not authorized")
				}
			}

			next()
		} catch (error) {
			next(error)
		}
	}

	return withMiddleware(middleware)
}
