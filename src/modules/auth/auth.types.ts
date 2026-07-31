export interface IAuthUtils {
	hashSecret(plainText: string): string
	compareSecret(plainPassword: string, encryptedPassword: string): Promise<boolean>
	jwtToken(payload: any, jwtSecret: string, expiresIn: any): string
	generateToken(user: any, jwtSecret: string, expiresIn: any): string
	verifyToken(token: string, jwtSecret: string): any
	hashCode(code: string): string
	generateResetCode(): { code: string; hashedCode: string }
	hashPin(pin: string): string
	verifyPin(plainPin: string, hashedPin: string): boolean
}

export interface IAuthService {
	login(data: any): Promise<{ accessToken: string; refreshToken: string }>
}

export const TYPES = {
	AuthUtils: Symbol.for("AuthUtils"),
	AuthService: Symbol.for("AuthService"),
}
