import type express from "express"
import { injectable } from "inversify"
import type { interfaces } from "inversify-express-utils"
import jwt from "jsonwebtoken"
import { config } from "@/config/env"
import { pinoLogger } from "@/config/pino-logger"
import type { AuthJwtPayload } from "@/types/base"
import { UserPrincipal } from "./user-principal"

@injectable()
export class AuthProvider implements interfaces.AuthProvider {
	public async getUser(
		req: express.Request,
		_res: express.Response,
		next: express.NextFunction,
	): Promise<interfaces.Principal> {
		try {
			// ─── Step 1: Extract Token ───────────────────────────────────
			const authHeader = req.headers.authorization
			const token = authHeader?.startsWith("Bearer ") ? authHeader?.split(" ")[1] : null

			if (!token) {
				pinoLogger.warn("Access denied: attempted authentication without valid token")
				return new UserPrincipal(null)
			}

			// ─── Step 2: Verify JWT ──────────────────────────────────────
			let decodedToken: AuthJwtPayload
			try {
				decodedToken = jwt.verify(token, config.JWT_TOKEN_SECRET) as AuthJwtPayload
			} catch (jwtError: any) {
				pinoLogger.warn(`Token verification failed: ${jwtError.message}`)
				return new UserPrincipal(null)
			}

			if (!decodedToken?.id) {
				pinoLogger.warn("Token payload missing userId")
				return new UserPrincipal(null)
			}

			return new UserPrincipal(decodedToken)
		} catch (error: any) {
			pinoLogger.error(`AuthProvider unexpected error: ${error.message}`)
			next(error)
			return new UserPrincipal(null)
		}
	}
}
