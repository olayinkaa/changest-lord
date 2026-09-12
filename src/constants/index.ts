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

export const DEFAULT_SYSTEM_SETTINGS = [
	{
		key: "transfer_fee_absolute",
		name: "Absolute Transfer Fee",
		value: "50",
		description: "Flat fee charged per transfer (in Naira)",
	},
	{
		key: "transfer_fee_percentage",
		name: "Percentage Transfer Fee",
		value: "1.5",
		description: "Percentage fee charged per transfer (%)",
	},
	{
		key: "password_change_frequency_days",
		name: "Password Expiry (Days)",
		value: "90",
		description: "How often users must change passwords",
	},
	{
		key: "min_withdrawal_amount",
		name: "Minimum Withdrawal Limit",
		value: "1000",
		description: "Minimum allowed single withdrawal",
	},
	{
		key: "maintenance_mode",
		name: "Maintenance Mode",
		value: "false",
		description: "Enable/Disable system access",
	},
] as const
