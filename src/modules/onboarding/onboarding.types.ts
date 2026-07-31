export const ONBOARDING_TYPES = {
	Service: Symbol.for("OnboardingService"),
	Repository: Symbol.for("OnboardingRepository"),
	Controller: Symbol.for("OnboardingController"),
}

export interface IOnboardingRepository {
	findUserByPhone(phone: string): Promise<any | null>
	createUserWithKyc(data: any): Promise<any>
	updateUserDetails(userId: string, data: any): Promise<any>
	updateUserRole(userId: string, role: string): Promise<any>
	updateSellerDetails(userId: string, data: any): Promise<any>
	updateSecurityInfo(userId: string, pinHash: string, userId5: string): Promise<any>
	updateKycStatus(userId: string, status: any): Promise<any>
	bindDevice(userId: string, deviceData: any): Promise<any>
}

export interface IOnboardingService {
	validatePhone(phone: string): Promise<{ phone: string; available: boolean }>
	saveDetails(userId: string, data: any): Promise<any>
	setUserType(userId: string, type: string): Promise<any>
	processSellerBusiness(userId: string, data: any): Promise<any>
	initiateLiveness(userId: string): Promise<any>
	verifyLiveness(userId: string, sessionId: string): Promise<any>
	finalizeSecurity(userId: string, pin: string): Promise<{ userId5: string }>
	completeOnboarding(userId: string, deviceData: any): Promise<void>
}
