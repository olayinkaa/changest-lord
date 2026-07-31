import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { injectable } from "inversify"
import jwt, { type SignOptions } from "jsonwebtoken"
import type { IAuthUtils } from "./auth.types"

@injectable()
export class AuthUtils implements IAuthUtils {
	/**
	 *
	 * @param plainText - user password
	 * @returns
	 */
	encryptPassword(plainText: string) {
		const salt = bcrypt.genSaltSync(10)
		return bcrypt.hashSync(plainText, salt)
	}
	/**
	 * Compare plain text password with encrypted password
	 * @param plainPassword - plain password
	 * @param encryptedPassword - encrypted password
	 * @returns
	 */
	async comparePassword(
		plainPassword: string,
		encryptedPassword: string,
	): Promise<boolean> {
		const isMatch = await bcrypt.compare(plainPassword, encryptedPassword)
		return isMatch
	}

	/**
	 * @param payload
	 * @param jwtSecret - JWT SECRET
	 * @param expiresIn
	 * @returns
	 */
	jwtToken(payload: any, jwtSecret: string, expiresIn: any): string {
		const options: SignOptions = { expiresIn }
		return jwt.sign(payload, jwtSecret, options)
	}

	/**
	 *
	 * @param user
	 * @param jwtSecret
	 * @param expiresIn
	 * @returns
	 */
	generateToken(user: any, jwtSecret: string, expiresIn: any) {
		const token = this.jwtToken(user, jwtSecret, expiresIn)
		return token
	}

	/**
	 *
	 * @param token
	 * @param jwtSecret
	 * @returns
	 */
	verifyToken(token: string, jwtSecret: string) {
		try {
			return jwt.verify(token, jwtSecret)
		} catch (err) {
			console.error(err)
			return null
		}
	}
	/**
	 *
	 * @param code
	 * @returns
	 */
	hashCode(code: string): string {
		return crypto.createHash("sha256").update(code).digest("hex")
	}

	generateResetCode() {
		const code = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit
		const hashedCode = this.hashCode(code)
		return { code, hashedCode }
	}
}
