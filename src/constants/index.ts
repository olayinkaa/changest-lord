export const constants = {
	TOKEN_EXPIRES_IN: "30m", // 10m, 15s, 1h, 7d
	REFRESH_TOKEN_EXPIRES_IN: "7d",
	SERVICE_PORT: 6001,
	CONFIDENCE_THRESHOLD: 98,
	LIVENESS_WEB_URL: "https://www.myfacecard.ai/liveness",
}

export const OnboardingScopes = {
	PROFILE: "onboarding:profile", // After phone validation
	BUSINESS: "onboarding:business", // After user profile completion (for sellers)
	LIVENESS: "onboarding:liveness", // After business profile completion
	PIN: "onboarding:pin", // After liveness or customer profile completion
} as const

export const AwsCollectionId = {
	USERS: "mychange-users",
}
