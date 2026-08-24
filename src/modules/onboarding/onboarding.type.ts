import type {
	OnboardingBusinessProfileRequest,
	OnboardingProfileRequest,
} from "./onboarding.dto"

export const ONBOARDING_TYPES = {
	Service: Symbol.for("OnboardingService"),
	Repository: Symbol.for("OnboardingRepository"),
}

export interface IOnboardingService {
	validatePhone(phone: string): Promise<any>
	validateBusinessName(businessName: string): Promise<any>
	onboardUserProfile(
		onboardingUser: { id: string; phone: string },
		data: OnboardingProfileRequest,
	): Promise<any>
	onboardBusinessProfile(
		onboardingUser: { id: string; phone: string },
		data: OnboardingBusinessProfileRequest,
	): Promise<any>
	createPin(userId: string, pin: string): Promise<any>
	validateEmail(email: string): Promise<any>
}
