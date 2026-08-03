# Change Log

## 2026-07-31

### Feat: Implement User PIN Creation and Phone/PIN Login
- **High-level description:** Added functionality for users to set up a secure 4-digit PIN and a login endpoint that authenticates users via phone number and PIN.
- **Files modified:**
  - `src/modules/user/user.dto.ts` — added `CreatePinRequest` DTO with 4-digit validation.
  - `src/modules/user/user.types.ts` — updated `IUserRepository` and `IUserService` with PIN management methods.
  - `src/modules/user/user.service.ts` — implemented `createPin` logic using `AuthUtils` for hashing.
  - `src/modules/user/user.repository.ts` — implemented `updateUserPin`, `updateKycPinStatus`, and `findUserByPhone` for database persistence.
  - `src/modules/user/user.controller.ts` — added `POST /users/:id/create-pin` endpoint.
  - `src/modules/auth/auth.dto.ts` — created `LoginRequest` DTO for phone/PIN input validation.
  - `src/modules/auth/auth.types.ts` — added `IAuthService` interface and `TYPES.AuthService` DI token.
  - `src/modules/auth/auth.service.ts` — implemented `login` logic including PIN verification and JWT token generation (Access & Refresh tokens).
  - `src/modules/auth/auth.controller.ts` — created `AuthController` with `POST /auth/login` endpoint.
  - `src/modules/auth/auth.module.ts` — registered `AuthService`, `AuthController`, and `AuthRepository` in the DI container.
- **Rationale:** Completes the security setup phase of onboarding and provides the primary authentication mechanism for the application.
- **Verified:** Logic ensures only users who have set a PIN can log in, and utilizes the existing `AuthUtils` for secure password hashing and JWT issuance.

## 2026-08-02

### Fix: Refactor Onboarding Scope Middleware
- **High-level description:** Updated the `enforceOnboardingScope` middleware to align with project architectural standards and fix TypeScript errors.
- **Files modified:**
  - `src/core/middleware/enforce-onboarding-scope.ts` — replaced raw JSON responses with `HttpException` subclasses, used validated `config` for secrets, and fixed unused `res` parameter.
  - `src/types/global.d.ts` — extended the global `Request` interface to include `onboardingUser`.
- **Rationale:** Ensures consistent error handling across the API, leverages Zod-validated environment variables, and resolves type mismatches on the request object.

## 2026-08-02

### Fix: Strengthen Onboarding Scope Typing
- **High-level description:** Updated the `enforceOnboardingScope` middleware to use a strictly typed scope based on `OnboardingScopes\) instead of a generic string.
- **Files modified:**
  - `src/core/middleware/enforce-onboarding-scope.ts` — imported `OnboardingScopes`, defined `OnboardingScope` type, and applied it to the middleware parameter and token payload.
- **Rationale:** Prevents invalid scope strings from being passed to the middleware and ensures type safety when verifying the token's scope.

## 2026-08-02

### Fix: Correct Express Request Type Augmentation
- **High-level description:** Fixed the incorrect augmentation of the `Request` interface by moving it from `global.d.ts` to `express.d.ts`.
- **Files modified:**
  - `src/types/global.d.ts` — removed the generic `Request` interface extension.
  - `src/types/express.d.ts` — ensured correct augmentation of the `Express.Request` namespace.
- **Rationale:** Extending a global `Request` interface is incorrect for Express.js and can cause conflicts with DOM types. Using the `Express` namespace in a dedicated `express.d.ts` file is the standard way to extend Express request properties.

## 2026-08-02

### Fix: Resolve Type Mismatch in OnboardingController
- **High-level description:** Fixed a TypeScript error where `userId` (type `string | undefined`) was passed to a method expecting a `string`.
- **Files modified:**
  - `src/modules/onboarding/onboarding.controller.ts` — added a null check for `userId` and integrated `UnauthorizedException`.
- **Rationale:** Ensures that the liveness session is only initiated when a valid user ID is present in the request context, preventing runtime crashes and providing clear error responses.
