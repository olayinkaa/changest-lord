import { type interfaces, withMiddleware } from "inversify-express-utils"
import { UnauthorizedException } from "../errors/exceptions"

export function AuthGuard() {
	return withMiddleware(async (req, _, next) => {
		try {
			const httpContext: interfaces.HttpContext = Reflect.getMetadata(
				"inversify-express-utils:httpcontext",
				req,
			)

			if (!httpContext) {
				return next(new UnauthorizedException("Authentication is required"))
			}

			const isAuthenticated = await httpContext.user.isAuthenticated() // ← await here

			if (!isAuthenticated) {
				return next(new UnauthorizedException("Authentication is required"))
			}

			next()
		} catch {
			next(new UnauthorizedException("Authentication is required"))
		}
	})
}
