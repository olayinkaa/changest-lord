export const constants = {
	TOKEN_EXPIRES_IN: "30m", // 10m, 15s, 1h, 7d
	REFRESH_TOKEN_EXPIRES_IN: "7d",
	SERVICE_PORT: 6001,
	CONFIDENCE_THRESHOLD: 98,
}

export const OnboardingScopes = {
	PROFILE: "onboarding:profile", // Issued after phone validation
	LIVENESS: "onboarding:liveness", // Issued after profile completion
	PIN: "onboarding:pin", // Issued after passing liveness check
} as const
