# Code Review: `OnboardingService`

## Overview
The `OnboardingService` handles the multi-step user onboarding process, including phone validation, profile creation, business profile setup, PIN creation, and email validation. It integrates with several repositories and external services (AWS SES, Cloudinary/Rekognition via `UserService` context, etc.).

## Findings & Improvements

### 1. Critical Issues (Correctness & Reliability)
- **Lack of Transactions in `createPin`**: The `createPin` method performs multiple database writes (`updateUserPinAndUserId5`, `createWallet`, `executeTransitClaim`). If any step fails (e.g., `executeTransitClaim` fails), the user is left in a partially onboarded state.
    - **Recommendation**: Wrap the DB operations in a transaction.
- **Unchecked `emailProducer` failure**: While the welcome email is queued as a background task and the error is logged, a failure here doesn't block the response. This is generally acceptable for emails, but the `throw new Error` on line 221 is a runtime crash if `updatedUser.email` is missing.
    - **Recommendation**: Use a typed exception (e.g., `BadRequestException`) instead of a raw `Error`.

### 2. Security & Validation
- **Hardcoded `fromEmail`**: The `fromEmail` is hardcoded as `"olayinka@borgestech.co"` (line 233).
    - **Recommendation**: Move this to `config/env.ts` or a constant.
- **JWT Token Expiry**: Onboarding tokens are set to `15m`. Depending on the user's speed in filling out profiles, this might be too short, leading to friction.
    - **Recommendation**: Consider a slightly longer duration or a refresh mechanism for the onboarding flow.
- **Business Type Validation**: In `onboardBusinessProfile`, `this.businessTypeService.getBusinessTypeById` is called but the result is ignored. If the ID is invalid, does it throw? If not, the profile is updated with a potentially invalid ID.
    - **Recommendation**: Ensure the service throws a `NotFoundException` if the ID is invalid.

### 3. Maintainability & Architecture
- **Duplicated Token Logic**: The logic for generating the "next step" token ( assembling payload $\rightarrow$ `generateToken`) is repeated in `validatePhone`, `onboardUserProfile`, and `onboardBusinessProfile`.
    - **Recommendation**: Extract this into a private helper method: `generateOnboardingToken(user: User): string`.
- **Magic Strings**: `myChange://` (line 23) is hardcoded.
    - **Recommendation**: Move to constants.
- **Type Safety**: Several methods return `Promise<any>` (e.g., `validatePhone`).
    - **Recommendation**: Define explicit response DTOs or interfaces for these methods.

### 4. Performance & Efficiency
- **Sequential Transit Claims**: `createPin` loops through `pendingCredits` and awaits `executeTransitClaim` sequentially. If there are many credits, this slows down the API response.
    - **Recommendation**: Use `Promise.all()` if the claims are independent, or move this logic to a background worker.

---

## Proposed Refactoring Plan

1. **Extract Token Helper**:
   ```typescript
   private generateOnboardingToken(user: any) {
     const nextScope = mapStepToNextScope(user.onboardingStep, user.userType ?? undefined);
     const payload = { userId: user.id, phone: user.phone, userType: user.userType, scope: nextScope };
     return this.authUtils.generateToken(payload, config.JWT_ONBOARDING_SECRET, "15m");
   }
   ```

2. **Transaction Wrap in `createPin`**:
   Move the wallet creation and transit claims into a repository-level transaction to ensure atomicity.

3. **Config Refresh**:
   Move `fromEmail` and `livenessRedirectUrl` to the environment configuration.
