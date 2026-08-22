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

## 2026-08-13

### Fix: Resolve ESM `ERR_MODULE_NOT_FOUND` When Running Compiled Output
- **High-level description:** `node dist/index.js` was failing with `ERR_MODULE_NOT_FOUND` because TypeScript (with `module: "ESNext"`) was emitting relative imports without the `.js` extension (e.g. `import "./config/env"`), which Node's native ESM resolver rejects. The project already had `tsc-alias` in the build pipeline for path-alias rewriting, but no step that adds file extensions.
- **Files modified:**
  - `package.json` — added `tsc-esm-fix` as a devDependency and appended it to the `build` script (`tsc && tsc-alias && tsc-esm-fix --target dist`).
  - `tsconfig.json` — no behavioural change retained; one experimental `rewriteRelativeImportExtensions` attempt was tried and reverted because it only rewrites when the source already has a `.ts` extension (the project uses bare relative paths).
- **Rationale:** `tsc-esm-fix` post-processes the emitted `dist/` files and appends `.js` to every relative import (e.g. `./config/env` → `./config/env.js`, `../constants` → `../constants/index.js`), making the output natively runnable under `node` ESM without requiring source-code changes. It is invoked after `tsc-alias` so path-alias resolution (`@/*`) is finalised before extensions are normalised.
- **Verified:** After `pnpm run build`, `dist/index.js` now contains `import { config } from "./config/env.js";` etc. `import('./dist/config/env.js')` resolves successfully (fails only on env-var validation, which is expected without a `.env`). The original `ERR_MODULE_NOT_FOUND` no longer occurs.
- **Note:** Running `pnpm run start` directly still won't have env vars loaded — use `node --env-file=.env dist/index.js` (Node 20.6+) or `dotenv -e .env -- node dist/index.js`. A separate, pre-existing issue was observed in the **generated Prisma client** (`dist/generated/prisma/client.js`) — its template-literal output is malformed and unrelated to this import-resolution fix.

## 2026-08-17

### Feat: Add Swagger UI / OpenAPI documentation
- **High-level description:** Wired Swagger UI into the bootstrap so the controller surface has an interactive reference. The README previously referenced a Swagger URL that did not exist. Built an OpenAPI 3.1 spec via `swagger-jsdoc` from `@openapi` JSDoc blocks on controllers + DTOs, and serve it through `swagger-ui-express`. Documented `UserController` and `AddressController` as reference patterns; the remaining modules (`auth`, `business-type`, `liveness`, `onboarding`) follow the same convention in follow-up PRs.
- **Files modified:**
  - `package.json` — added `swagger-jsdoc@^6.2.8` and `swagger-ui-express@^5.0.1` as dependencies; added `@types/swagger-jsdoc` and `@types/swagger-ui-express` as devDependencies.
  - `tsconfig.json` — extended `"types": ["node"]` to `["node", "swagger-jsdoc", "swagger-ui-express"]` so TS resolves the new ambient type packages (the original array restricts type acquisition).
  - `src/config/swagger.ts` *(new)* — exports `swaggerSpec`, `swaggerUiOptions`, and `isSwaggerEnabled`. Globs `src/modules/** /*.controller.{ts,js}` and `src/modules/** /*.dto.{ts,js}` so future modules are picked up automatically. Defines shared `ApiResponse` + `ErrorResponse` schemas (matching `src/utils/http-response.ts` and `src/core/errors/error-handler.ts`), bearer JWT security scheme, and per-module tags.
  - `src/index.ts` — imports `swagger-ui-express` + `src/config/swagger`; mounts `/docs` (UI) and `/docs.json` (raw spec) inside `server.setConfig` after `helmet` but before `pinoHttp`. Gated to `NODE_ENV !== "production"`, with an `ENABLE_DOCS=true` env override.
  - `src/modules/user/user.controller.ts` — added `@openapi` JSDoc blocks above the class and `getUser`. Registers the `User` schema and documents `GET /users` (200 array, 401) and `GET /users/{id}` (200, 404). Both routes opt out with `security: []` (no auth yet).
  - `src/modules/address/address.controller.ts` — added `@openapi` blocks above the class and `getGeometry`. Registers `AddressPrediction`, `AddressAutocompleteResponse`, and `AddressGeometry` schemas. Documents `GET /address/autocomplete` (search query, 200, 400) and `GET /address/geometry` (placeId query, 200, 400).
- **Rationale:** `swagger-jsdoc` + `swagger-ui-express` were chosen because they coexist cleanly with `inversify-express-utils` (no route generation conflict, no migration off `class-validator` DTOs). The two-module scope was confirmed with the user to leave a concrete reference pattern that other modules can copy verbatim. The dev/staging-only gate prevents leaking internal schemas in production unless explicitly enabled.
- **Verified:** Ran a throwaway probe that loaded `src/config/swagger.ts` directly. Output confirmed the spec contains exactly the 4 expected paths (`/users`, `/users/{id}`, `/address/autocomplete`, `/address/geometry`), 6 schemas (shared `ApiResponse`/`ErrorResponse` + `User`/`AddressPrediction`/`AddressAutocompleteResponse`/`AddressGeometry`), the `bearerAuth` security scheme, and `Users`/`Address` tags. `isSwaggerEnabled` correctly returns `false` when `NODE_ENV=production`. Biome passes (`pnpm run lint:check:fix`, 75 files checked). TS diagnostics clean. Live UI smoke test was not run because `.env` contains real credentials and `prisma.$connect` runs before the server starts; follow-up can boot with a stubbed `.env.local`.
- **Out of scope (intentionally):** Documenting `auth`, `business-type`, `liveness`, `onboarding`; wiring `passport-jwt` to enforce auth on `/users` and `/business-types`; cleaning up the empty `user.request.dto.ts` and unused `liveness.dto.ts`; fixing `BusinessTypeController.getOne` (missing `this.json(...)` wrap) and renaming `AuthController.login2`.

## 2026-08-18

### Refactor: Move OpenAPI spec from controller JSDoc to per-module YAML
- **High-level description:** Replaced the inline `@openapi` JSDoc on `UserController` and `AddressController` with a per-module YAML spec under `src/docs/`. The OpenAPI document is now loaded at boot via `@apidevtools/swagger-parser` (replaces `swagger-jsdoc`, which only parses JSDoc). Standard OpenAPI 3.1 `$ref` resolves every cross-file link at boot, so the served spec is one inlined document. Added a `pnpm run docs:check` script that runs `SwaggerParser.validate` so malformed YAML or broken `$ref`s fail CI instead of silently breaking the docs UI.
- **Files added:**
  - `src/docs/openapi.yaml` — root spec: info, servers, security, tags, and `$ref`s into the per-module files.
  - `src/docs/paths/users.yaml` — `/users` and `/users/{id}` keyed as `users` / `usersById`.
  - `src/docs/paths/address.yaml` — `/address/autocomplete` and `/address/geometry` keyed as `autocomplete` / `geometry`.
  - `src/docs/schemas/_shared.yaml` — shared `ApiResponse` + `ErrorResponse` schemas.
  - `src/docs/schemas/user.yaml` — `User` schema.
  - `src/docs/schemas/address.yaml` — `AddressPrediction`, `AddressAutocompleteResponse`, `AddressGeometry` schemas.
  - `scripts/docs-check.ts` — CI linter that validates `src/docs/openapi.yaml` via `SwaggerParser.validate` and prints the resolved paths/schemas; exits non-zero on failure.
- **Files modified:**
  - `package.json` — removed `swagger-jsdoc` and `@types/swagger-jsdoc`; added `@apidevtools/swagger-parser@^12.1.0` and `openapi-types@^12.1.3` as direct dependencies; added `docs:check` script (`tsx scripts/docs-check.ts`).
  - `tsconfig.json` — restored `"types": ["node", "swagger-ui-express"]` (no longer references `swagger-jsdoc`).
  - `src/config/swagger.ts` — rewritten to load `src/docs/openapi.yaml` via `SwaggerParser.validate` and export `swaggerSpecPromise` (memoised) instead of a sync `swaggerSpec`. Server URL is now overridden at boot with the runtime `SERVICE_PORT` so the "Try it out" button always points at the current process.
  - `src/index.ts` — awaits `swaggerSpecPromise` before building the server so the synchronous `setConfig` callback can mount Swagger UI; passes the resolved spec via closure.
  - `src/modules/user/user.controller.ts` — reverted to original clean state (no `@openapi` JSDoc).
  - `src/modules/address/address.controller.ts` — reverted to original clean state (no `@openapi` JSDoc).
- **Rationale:** Inline JSDoc on every controller polluted the codebase with `/** ... */` blocks that had to be kept in lockstep with the runtime behaviour. The per-module YAML split keeps controllers as pure business logic and makes the API surface greppable from a single `src/docs/` folder. Standard OpenAPI `$ref` is supported by every validator and Postman import, so no tooling is locked in. The CI script catches malformed YAML or broken `$ref`s on PR. `swagger-jsdoc` was removed because it only converts JSDoc — its dependency on a JSDoc source was the reason it didn't fit a YAML-first design.
- **Verified:** `pnpm run docs:check` reports `4 paths, 6 schemas` and exits 0. A runtime probe of `src/config/swagger.ts` (loading via the actual boot path) returned the same 4 paths, 6 schemas, `bearerAuth` security scheme, and `Users`/`Address` tags as the previous JSDoc-based version, plus the runtime server URL (`http://localhost:6001/api/v1`). Biome: 75 files checked, 0 fixes. TS diagnostics: 0 errors.
- **Adding a new module (recipe):**
  1. Create `src/docs/paths/<module>.yaml` (keyed by operation name).
  2. Create `src/docs/schemas/<module>.yaml` (keyed by schema name).
  3. Add `$ref` entries to `src/docs/openapi.yaml` under `paths:` and `components.schemas:`.
  4. Add the module's tag to `tags:` in `src/docs/openapi.yaml`.
  5. Run `pnpm run docs:check` to confirm every `$ref` resolves.

### Fix: Downgrade OpenAPI version to 3.0.3 to clear VS Code schema warning
- **Files modified:**
  - `src/docs/openapi.yaml` — `openapi: 3.1.0` → `3.0.3`.
  - `src/config/swagger.ts` — fallback spec `openapi` field bumped down to match.
- **Rationale:** VS Code's bundled YAML OpenAPI schema (the `swaggerviewer:openapi` model) only validates up to `3.0.x` and flags `3.1.0` with `String does not match the pattern of "^3\.0\.\d(-.+)?$"`. The spec doesn't use any 3.1-specific features, so pinning to `3.0.3` is the lowest-friction fix. Easy to bump back to 3.1.0 once the schema the IDE ships catches up, or when the team installs an OpenAPI 3.1-aware VS Code extension (e.g. `redocly.openapi-cli`).
- **Verified:** IDE diagnostics clean across all `src/docs/**` files. `pnpm run docs:check` still reports `4 paths, 6 schemas` and exits 0.

## 2026-08-21

### Feat: Paginate user list, add BVN flag, generate 5-digit userId for sellers
- **High-level description:** Added server-side pagination + filtering to `GET /users`, surface-only response shaping via `UserResponseDto`, BVN-verified flag on the KYC record, and a utility that mints a unique 5-digit `userId5` for seller accounts during PIN creation.
- **Files added:**
  - `prisma/migrations/20260821211742_include_bvn_verified/migration.sql` — adds `bvnVerified BOOLEAN NOT NULL DEFAULT false` to `user_kycs`.
  - `src/common/dto/pagination.dto.ts` — `PaginationQueryDto` (`page` / `size` with sane defaults + bounds).
  - `src/common/utility/utility.module.ts` — Inversify `ContainerModule` binding `UtilityService`.
  - `src/common/utility/utility.service.ts` — `generateUniqueUserId5()` retry-loop against `findByUserId5`.
  - `src/common/utility/utility.type.ts` — `UTILITY_TYPES` symbol + `IUtilityService` contract.
  - `src/modules/user/user.dto.ts` — `UserQueryDto` (extends `PaginationQueryDto`), `UserResponseDto`, `UserBusinessTypeResponseDto`.
  - `src/modules/kyc/kyc.dto.ts` — `KycResponseDto` (Exposes a vetted subset; hides emailVerified/phoneVerified/locationVerified/whatsappVerified/isSmsVerified via `@Exclude`).
- **Files modified:**
  - `prisma/models/user.prisma` — `UserKyc.bvnVerified Boolean @default(false)`.
  - `src/app.module.ts` — registers `UtilityModule` alongside existing modules; formatting aligned with Biome (semicolons, double quotes).
  - `src/types/base.ts` — adds `PaginatedResult<T>` and `PaginatedResponse<T>` shapes.
  - `src/types/enum.ts` — adds `ErrorType.USER_NOT_FOUND`.
  - `tsconfig.json` — sets `strictPropertyInitialization: false` (Inversify parameter-decorator ergonomics).
  - `src/modules/user/user.controller.ts` — `GET /` now accepts `UserQueryDto` validated by `validateQuery`; pass-through to service.
  - `src/modules/user/user.service.ts` — `getAllUsers(query)` returns `PaginatedResponse<UserResponseDto>`; `getUser(id)` returns a single sanitized `UserResponseDto`.
  - `src/modules/user/user.repository.ts` — replaces `findAllWithKycAndBusiness` with `findAll(query)` (filter + skip/take + parallel count), adds `findByUserId5`, adds `updateUserPinAndUserId5`, removes `livenessDone` auto-set on profile create.
  - `src/modules/user/user.types.ts` — updates `IUserRepository`/`IUserService` contracts; `getAllUsers` now takes `UserQueryDto` and returns `PaginatedResponse<UserResponseDto>`.
  - `src/modules/onboarding/onboarding.service.ts` — `createPin` now looks up the user, generates `userId5` for sellers via `UtilityService`, persists both atomically with `updateUserPinAndUserId5`, and includes `userType` in the access/refresh token payload.
  - `src/modules/business-type/business-type.dto.ts` — Biome formatting (tabs → spaces, semicolons) plus dropping the unused `// @Exclude() userId!: string;` line in `BusinessTypeResponseDto`.
- **Rationale:** Lists were unbounded (`findMany`) which would not scale; pagination is needed before any admin UI reads from `GET /users`. `UserResponseDto` prevents sensitive fields (`pinHash`, `livenessImagePublicId`, `businessTypeId`) from leaking. `userId5` is the seller's display identifier surfaced to merchants / POS flows, so it must be unique and assigned the moment onboarding finalises. The BVN flag mirrors the existing NIN / phone-verification pattern and unlocks a follow-up KYC endpoint without another migration.
- **Verified:** Biome passes (`pnpm exec biome check --write ./src` → 93 files, only style nits, 0 errors). Husky pre-commit ran `biome check --write --no-errors-on-unmatched` on the 16 staged files and re-staged them — commit landed on `feature/user-pagination-kyc-bvn` (commit `f2c6a62`). Schema fields confirmed: `UserKyc.bvnVerified` and `User.userId5 @unique` exist in `prisma/models/user.prisma`. `validateQuery` middleware exists at `src/core/middleware/validate-query.ts`.
- **Follow-ups (intentionally not in this commit):** Wire `passport-jwt` so `GET /users` is auth-gated; document `GET /users` (and the new query params) in `src/docs/paths/users.yaml`; expose a `KycResponseDto` mapping helper (today `plainToInstance(UserResponseDto, …)` triggers class-transformer on `kyc`, but no transformer is wired for the nested `UserBusinessTypeResponseDto` until DTO refs are tightened).

## 2026-08-22

### Feat: BVN validation endpoint with local cache, JWT auth provider, AWS Rekognition collection bootstrap
- **High-level description:** Stand up the production KYC slice — a `POST /kyc/validate-bvn` flow backed by Dojah with a `bvn_caches` table that short-circuits repeat lookups; wire `inversify-express-utils`' `AuthProvider` so the `AuthGuard` decorator can gate controllers behind a real Bearer-token JWT; and bootstrap the AWS Rekognition face-collection at process start so the first `compareFaces` call doesn't race the create-if-missing.
- **Files added:**
  - `prisma/migrations/20260821232454_added_bvn_cache_table/migration.sql` — creates `bvn_caches` (unique on `bvn`); adds unique constraints on `users.nin` and `users.bvn`.
  - `prisma/models/bvn_cache.prisma` — `BvnCache` model mapped to `bvn_caches`.
  - `src/core/guards/auth.guard.ts` — `AuthGuard()` decorator; reads `interfaces.HttpContext` from request metadata and rejects unauthenticated principals via `UnauthorizedException`.
  - `src/providers/auth-provider.ts` — `AuthProvider implements interfaces.AuthProvider`. Pulls Bearer token, verifies with `JWT_TOKEN_SECRET`, builds a `UserPrincipal` from the decoded payload.
  - `src/providers/user-principal.ts` — `UserPrincipal implements interfaces.Principal` with `isAuthenticated()` (returns `Promise<boolean>` per contract).
- **Files modified:**
  - `prisma/models/user.prisma` — unique indexes on `nin` and `bvn`.
  - `src/index.ts` — `setup()` now `await`s the AWS Rekognition collection bootstrap (non-fatal on error so the service still starts in dev) before building the `InversifyExpressServer`; passes `AuthProvider` as the 5th ctor arg.
  - `src/modules/kyc/kyc.controller.ts` — `POST /kyc/validate-bvn` (`@validateSchema(VerifyBvnDto)`).
  - `src/modules/kyc/kyc.dto.ts` — `VerifyBvnDto` (`@IsString`, `@Length(11, 11)`). `KycResponseDto` already in place from the 2026-08-21 commit.
  - `src/modules/kyc/kyc.service.ts` — `validateBvn` flow: existing-user → 400; cache hit → return; else call Dojah adapter and persist to `bvn_caches`. Returns `savedCache`. (Face-comparison + user-table update are wired but commented as steps 4 / 6 — implementation left for the follow-up.)
  - `src/modules/kyc/kyc.repository.ts` — `findBvnRecordLocally(bvn)` and `saveBvnRecordLocally(...)` over `prisma.bvnCache`.
  - `src/modules/kyc/kyc.types.ts` — `KYC_TYPES`, `IKycService`, `IKycRepository` contracts.
  - `src/modules/user/user.repository.ts` + `user.types.ts` — adds `findByBvn(bvn): Promise<User | null>` (used by `KycService.validateBvn` step 1).
  - `src/modules/user/user.controller.ts` — applies the new `AuthGuard` decorator so `GET /users` and `GET /users/:id` require an authenticated principal.
  - `src/adapters/aws-rekognition/aws-rekognition.service.ts` — `ensureCollectionExists(collectionId)` no-op if it already exists; logs and rethrows otherwise. (Implementation changes are a Biome-driven format pass — no behaviour added beyond the bootstrap call site.)
  - `src/adapters/verification/dojah/dojah.service.ts` — Biome formatting; behaviour unchanged.
  - `src/types/base.ts` — adds `AuthJwtPayload extends JwtPayload, IAuthUser` (consumed by `AuthProvider`).
  - `src/types/enum.ts` — adds `ErrorType.BVN_ALREADY_EXISTS`.
  - `src/types/express.d.ts` / `src/types/global.d.ts` — small type augmentation + Biome format pass.
- **Rationale:** Until now, `KycModule` was scaffolded but had no endpoint or persistence layer. The BVN cache is the most cost-sensitive part of the Dojah integration (every lookup is paid), so it's added at the same time as the endpoint rather than as a follow-up. Wiring `AuthProvider` now means every subsequent controller can opt into auth via a single decorator rather than retrofitting passport-jwt. Bootstrap-time Rekognition collection creation removes a race where the first `compareFaces` call during onboarding would otherwise fail with `ResourceNotFoundException`.
- **Verified:** Biome passes on src (`pnpm exec biome check --write ./src` → 96 files, 1 unsafe-fix warning left alone — unused private `api` in `YouVerifyService`, intentionally out of scope). Husky pre-commit re-ran Biome on the 18 staged files and re-staged them. Commit `0e6efb2` landed on `feature/kyc-bvn-cache-and-jwt-auth`. Cross-file consistency confirmed: `ADAPTER_TYPES.VerificationService` resolves to a `VerificationFactory` whose `IVerificationService.verifyBVN` matches `KycService.validateBvn`; `KycRepository.findBvnRecordLocally` ↔ `prisma.bvnCache.findUnique`; `userRepo.findByBvn` exists and is typed `Promise<User | null>`; `ErrorType.BVN_ALREADY_EXISTS` and `AuthJwtPayload` exported from the expected paths.
- **Follow-ups (intentionally not in this commit):** Step 4 (face comparison against liveness image) and step 6 (write `bvn`/`bvnVerified` to `users`) inside `KycService.validateBvn` — stubbed with comments. OpenAPI docs for `POST /kyc/validate-bvn` (add to `src/docs/paths/kyc.yaml`). Storing the `UserPrincipal.details` shape on the `Request` so downstream middleware can read `req.user.id` without re-decoding.
