import { lowerCase, startCase } from "lodash-es"
import { OnboardingScopes } from "@/constants"
import { OnboardingStep, UserType } from "@/generated/prisma/enums"

export const mapStepToNextScope = (step: OnboardingStep, userType?: UserType): string => {
	const isCustomer = userType?.toLowerCase() === UserType.customer
	switch (step) {
		case OnboardingStep.PHONE_VALIDATED:
			return OnboardingScopes.PROFILE
		case OnboardingStep.PROFILE_COMPLETED:
			// If user is a customer, skip liveness and go straight to PIN
			// if (isCustomer) {
			// 	return OnboardingScopes.PIN
			// }
			if (isCustomer) {
				return OnboardingScopes.LIVENESS
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

/**
 * Converts a snake_case, constant_case, or messy string into Title Case.
 *
 * @param {string} str - The string to convert (e.g., "GIVE_CHANGE")
 * @returns {string} The formatted title-case string (e.g., "Give Change")
 */
export const toTitleCase = (str: string) => {
	if (!str || typeof str !== "string") return ""
	return startCase(lowerCase(str))
}
