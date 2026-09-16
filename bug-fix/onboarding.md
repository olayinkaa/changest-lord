```tsx
async validatePhone(phone: string): Promise<any> {
    const existing = await this.userRepo.findByPhoneWithKyc(phone);

    if (existing) {
        // 1. If profile is explicitly completed, block them.
        if (existing?.kyc?.completedProfile) {
            throw new ConflictException("This phone number is already registered", {
                phoneNumber: "This phone number is already registered and has completed onboarding",
            });
        }

        // 2. Bugfix: Check if this is a "ghost" record (created by phone validation 
        // but never progressed past step 1, e.g., missing userType and onboardingStep).
        // If they haven't made any real profile progress, treat them like a brand new user 
        // or let them overwrite/resume cleanly.
        if (!existing.userType && !existing.onboardingStep) {
            const newPayload = {
                userId: existing.id,
                phone: existing.phone,
                scope: OnboardingScopes.PROFILE,
            };

            const onboardingProfileToken = this.authUtils.generateToken(newPayload, config.JWT_ONBOARDING_SECRET, "15m");

            return {
                description: "Phone number validated successfully.",
                currentStep: OnboardingStep.PHONE_VALIDATED,
                temporaryToken: onboardingProfileToken,
            };
        }

        // 3. Otherwise, resume the actual incomplete registration
        const nextScope = mapStepToNextScope(existing.onboardingStep, existing?.userType);

        const payload = {
            userId: existing.id,
            phone: existing.phone,
            userType: existing.userType,
            scope: nextScope,
        };

        const resumptionToken = this.authUtils.generateToken(payload, config.JWT_ONBOARDING_SECRET, "15m");

        return {
            description: "Resuming incomplete registration",
            currentStep: existing.onboardingStep,
            userType: existing.userType,
            temporaryToken: resumptionToken,
        };
    }

    // New User coming for the first time
    const newUser = await this.userRepo.createUserPhoneNumber(phone);
    const newPayload = {
        userId: newUser.id,
        phone: newUser.phone,
        scope: OnboardingScopes.PROFILE,
    };

    const onboardingProfileToken = this.authUtils.generateToken(newPayload, config.JWT_ONBOARDING_SECRET, "15m");

    return {
        description: "Phone number validated successfully.",
        currentStep: OnboardingStep.PHONE_VALIDATED,
        temporaryToken: onboardingProfileToken,
    };
}
```