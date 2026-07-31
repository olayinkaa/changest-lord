# Change Log

## 2026-07-31

### Feat: Implement AuthUtils for password and token management
- **High-level description:** Implemented `AuthUtils` service and `IAuthUtils` interface to centralize authentication utilities including bcrypt password hashing, JWT token generation/verification, and SHA-256 code hashing for password resets.
- **Files modified:**
  - `src/modules/auth/auth.types.ts` — defined `IAuthUtils` interface and `TYPES.AuthUtils` DI token.
  - `src/modules/auth/auth-utils.service.ts` — implemented `AuthUtils` class with methods for password encryption, comparison, JWT management, and reset code generation.
  - `src/modules/auth/auth.module.ts` — bound `TYPES.AuthUtils` to `AuthUtils` in singleton scope.
- **Rationale:** Provides a reusable, injectable utility for core security operations, separating the technical implementation of cryptography and tokenization from the business logic of the `AuthService`.
- **Verified:** Code follows the project's DI pattern and utilizes standard libraries (`bcryptjs`, `jsonwebtoken`, `crypto`).

### Feat: Multi-step User Onboarding Flow
- **High-level description:** Implemented a stateful onboarding sequence to profile new users. The flow includes phone validation (11 digits, 070/080 prefix), email validation via Amazon SES, address collection via Google Maps, role selection (Customer/Seller), and security setup (4-digit PIN, unique 5-digit User ID). Sellers additionally undergo a business profile update and AWS Rekognition liveness check. The flow concludes with device binding and a welcome email.
- **Files modified:**
  - `prisma/models/user.prisma` — added `userId5`, `pinHash`, `latitude`, `longitude`, `deviceBindingId`, and `virtualAccountNo` to `User` model; added `isSms laVerified` to `UserKyc`.
  - `prisma/models/user_device.prisma` — created new `UserDevice` model for hardware binding.
  - `src/modules/onboarding/` — created new module containing `onboarding.controller.ts`, `onboarding.service.ts`, `onboarding.repository.ts`, `onboarding.dto.ts`, `onboarding.types.ts`, and `onboarding.module.ts`.
  - `src/adapters/amazon-ses/amazon-ses.service.ts` — created new adapter for email verification and welcome messages.
  - `src/adapters/anchor-api-sdk/anchor.service.ts` — implemented `createVirtualAccount` to generate virtual accounts.
  - `src/adapters/adapters.types.ts` & `src/adapters/adapters.module.ts` — registered `AmazonSesService` and `AnchorApiSdkService`.
  - `src/utils/id-generator.ts` — created utility for generating unique random 5-digit User IDs with collision handling.
  - `src/app.module.ts` — registered `OnboardingModule`.
- **Rationale:** implements the core user acquisition and profiling funnel as required, ensuring security (PIN hashing, device binding) and identity verification (Liveness, SES) are integrated into the registration process.
- **Verified:** Implementation follows the established Controller -> Service -> Repository architectural pattern and uses standard `ApiResponse` envelopes.

## 2026-07-30
... (rest of the file)
