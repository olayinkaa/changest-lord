// import { OnboardingScopes } from "@/constants";
// import { OnboardingStep } from "@/generated/prisma/enums";

// export const mapStepToNextScope = (step: OnboardingStep): string => {
//   switch (step) {
//     case OnboardingStep.PHONE_VALIDATED:
//       return OnboardingScopes.PROFILE; // Needs to submit profile next
//     case OnboardingStep.PROFILE_COMPLETED:
//       return OnboardingScopes.LIVENESS; // Needs to run liveness check next
//     case OnboardingStep.LIVENESS_PASSED:
//       return OnboardingScopes.PIN; // Needs to set their security PIN next
//     default:
//       return OnboardingScopes.PROFILE; // Fallback safe default
//   }
// };

import { OnboardingScopes } from "@/constants"
import { OnboardingStep, UserType } from "@/generated/prisma/enums"

export const mapStepToNextScope = (step: OnboardingStep, userType?: UserType): string => {
	switch (step) {
		case OnboardingStep.PHONE_VALIDATED:
			return OnboardingScopes.PROFILE
		case OnboardingStep.PROFILE_COMPLETED:
			// If user is a customer, skip liveness and go straight to PIN
			if (userType === UserType.customer) {
				return OnboardingScopes.PIN
			}
			return OnboardingScopes.LIVENESS
		case OnboardingStep.LIVENESS_PASSED:
			return OnboardingScopes.PIN
		default:
			return OnboardingScopes.PROFILE
	}
}
