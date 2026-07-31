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
