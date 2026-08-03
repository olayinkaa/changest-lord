import type { OnboardingRequest } from "./onboarding.dto"

export const ONBOARDING_TYPES = {
	Service: Symbol.for("OnboardingService"),
	Repository: Symbol.for("OnboardingRepository"),
}

export interface IOnboardingService {
	validatePhone(phone: string): Promise<any>
	onboardUser(
		onboardingUser: { id: string; phone: string },
		data: OnboardingRequest,
	): Promise<any>
	createPin(userId: string, pin: string): Promise<any>
}
