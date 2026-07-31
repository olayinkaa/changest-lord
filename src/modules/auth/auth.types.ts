export interface IAuthUtils {
	encryptPassword(plainText: string): string
	comparePassword(plainPassword: string, encryptedPassword: string): Promise<boolean>
	jwtToken(payload: any, jwtSecret: string, expiresIn: any): string
	generateToken(user: any, jwtSecret: string, expiresIn: any): string
	verifyToken(token: string, jwtSecret: string): any
	hashCode(code: string): string
	generateResetCode(): { code: string; hashedCode: string }
}

export const TYPES = {
	AuthUtils: Symbol.for("AuthUtils"),
}
