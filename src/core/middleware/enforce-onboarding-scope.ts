import { withMiddleware } from "inversify-express-utils"
import jwt from "jsonwebtoken"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { OnboardingScopes } from "@/constants"
import { ForbiddenException, UnauthorizedException } from "@/core/errors/exceptions"

type OnboardingScope = (typeof OnboardingScopes)[keyof typeof OnboardingScopes]

interface OnboardingTokenPayload {
	userId: string
	phone: string
	scope: OnboardingScope
}

export const enforceOnboardingScope = (requiredScope: OnboardingScope) => {
	return withMiddleware((req, _res, next) => {
		const authHeader = req.headers.authorization

		if (!authHeader?.startsWith("Bearer ")) {
			return next(
				new UnauthorizedException("Access denied. Secure onboarding token is missing."),
			)
		}

		const token = authHeader.split(" ")[1]
		try {
			const decoded = jwt.verify(
				token,
				config.JWT_ONBOARDING_SECRET,
			) as OnboardingTokenPayload

			if (decoded.scope !== requiredScope) {
				return next(
					new ForbiddenException(
						`Forbidden. This token is authorized only for step scope: ${decoded.scope}.`,
						// `Forbidden. This token is authorized only for step scope: ${decoded.scope}. Required scope: ${requiredScope}`,
					),
				)
			}

			req.onboardingUser = { id: decoded.userId, phone: decoded.phone }

			next()
		} catch (error) {
			pinoLogger.error({ error })
			return next(
				new UnauthorizedException(
					"Your registration session has expired. Please restart the application.",
				),
			)
		}
	})
}
