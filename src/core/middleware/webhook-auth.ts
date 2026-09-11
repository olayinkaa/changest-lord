import crypto from "node:crypto"
import type { NextFunction, Request, Response } from "express"
import { withMiddleware } from "inversify-express-utils"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import { UnauthorizedException } from "@/core/errors/exceptions"

export function webhookAuth() {
	const middleware = (req: Request, _: Response, next: NextFunction) => {
		try {
			const signature = req.headers["x-brails-signature"] as string

			if (!signature) {
				pinoLogger.warn({ headers: req.headers }, "Webhook request missing signature header")
				throw new UnauthorizedException("Missing webhook signature")
			}

			const secret = config.BRAILS_WEBHOOK_SECRET
			const rawBody = (req as any).rawBody

			if (!rawBody) {
				pinoLogger.error("Request raw body is missing; cannot verify signature")
				throw new UnauthorizedException("Invalid request body")
			}

			const computedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

			if (computedSignature !== signature) {
				pinoLogger.warn(
					{
						received: signature,
						computed: computedSignature,
						event: (req.body as any)?.event,
					},
					"Webhook signature mismatch",
				)
				throw new UnauthorizedException("Invalid webhook signature")
			}

			next()
		} catch (error) {
			next(error)
		}
	}

	return withMiddleware(middleware)
}
