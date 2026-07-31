import { inject, injectable } from "inversify"
import { config } from "@/config/env"
import { UnauthorizedException } from "@/core/errors/exceptions"
import type { IUserRepository } from "../user/user.types"
import { USER_TYPES } from "../user/user.types"
import type { LoginRequest } from "./auth.dto"
import type { IAuthService, IAuthUtils } from "./auth.types"
import { TYPES as AUTH_TYPES } from "./auth.types"

@injectable()
export class AuthService implements IAuthService {
	constructor(
		@inject(AUTH_TYPES.AuthUtils)
		private authUtils: IAuthUtils,
		@inject(USER_TYPES.Repository)
		private userRepository: IUserRepository,
	) {}

	async login(data: LoginRequest) {
		const user = await this.userRepository.findUserByPhone(data.phone)

		if (!user) {
			throw new UnauthorizedException("Invalid phone number or PIN")
		}

		if (!user.pinHash) {
			throw new UnauthorizedException("User has not set up a PIN")
		}

		const isPinMatch = await this.authUtils.verifyPin(data.pin, user.pinHash)

		if (!isPinMatch) {
			throw new UnauthorizedException("Invalid phone number or PIN")
		}

		const payload = { id: user.id, phone: user.phone }

		const accessToken = this.authUtils.generateToken(
			payload,
			config.JWT_TOKEN_SECRET,
			config.JWT_TOKEN_EXPIRES_IN,
		)

		// For refresh token, typically we'd use a longer expiry and store it in DB
		// Since we don't have a specific refresh token logic yet, we'll generate one with a longer expiry
		const refreshToken = this.authUtils.generateToken(
			payload,
			config.JWT_REFRESH_TOKEN_SECRET,
			config.JWT_REFRESH_TOKEN_EXPIRES_IN,
		)

		return { accessToken, refreshToken }
	}
}
