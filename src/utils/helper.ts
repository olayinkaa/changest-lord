import { OnboardingScopes } from "@/constants"
import { OnboardingStep, UserType } from "@/generated/prisma/enums"

export const mapStepToNextScope = (step: OnboardingStep, userType?: UserType): string => {
	const isCustomer = userType?.toLowerCase() === UserType.customer
	switch (step) {
		case OnboardingStep.PHONE_VALIDATED:
			return OnboardingScopes.PROFILE
		case OnboardingStep.PROFILE_COMPLETED:
			// If user is a customer, skip liveness and go straight to PIN
			if (isCustomer) {
				return OnboardingScopes.PIN
			}
			return OnboardingScopes.BUSINESS
		case OnboardingStep.BUSINESS_PROFILE_COMPLETED:
			return OnboardingScopes.LIVENESS
		case OnboardingStep.LIVENESS_PASSED:
			return OnboardingScopes.PIN
		default:
			return OnboardingScopes.PROFILE
	}
}
