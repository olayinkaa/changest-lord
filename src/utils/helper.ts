import { OnboardingScopes } from "@/constants"
import { OnboardingStep } from "@/generated/prisma/enums"

export const mapStepToNextScope = (step: OnboardingStep): string => {
	switch (step) {
		case OnboardingStep.PHONE_VALIDATED:
			return OnboardingScopes.PROFILE // Needs to submit profile next
		case OnboardingStep.PROFILE_COMPLETED:
			return OnboardingScopes.LIVENESS // Needs to run liveness check next
		case OnboardingStep.LIVENESS_PASSED:
			return OnboardingScopes.PIN // Needs to set their security PIN next
		default:
			return OnboardingScopes.PROFILE // Fallback safe default
	}
}
