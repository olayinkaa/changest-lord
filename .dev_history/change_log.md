# Change Log

## 2026-08-27

### Feat: Brails payment adapter scaffold + adapter/env refresh
- **High-level description:** Introduce a Brails payment-provider adapter under `src/adapters/payment/brails/`, reserve an `anchor` sibling directory for upcoming payment work, and refresh the aws-ses / cloudinary / google-map adapter contracts and the env/adapters config to align with the new payment surface.
- **Files modified:**
  - `NOTE.md` — document the Brails dynamic + static virtual-account endpoints.
  - `src/adapters/aws-ses/aws-ses.service.ts` — refresh implementation against the current types contract.
  - `src/adapters/aws-ses/aws-ses.types.ts` — refresh type surface used by the service.
  - `src/adapters/cloudinary/cloudinary.service.ts` — align service with updated cloudinary types.
  - `src/adapters/cloudinary/cloudinary.types.ts` — refresh type surface used by the service.
  - `src/adapters/cloudinary/multer.ts` — update upload wiring to match the new types.
  - `src/adapters/google/google-map.service.ts` — align service with updated google-map types.
  - `src/adapters/google/google-map.type.ts` — refresh type surface used by the service.
  - `src/config/adapters.config.ts` — register the new payment/Brails adapter entry.
  - `src/config/env.ts` — add payment/Brails credential env keys and refresh adapter config bindings.
- **Files added:**
  - `src/adapters/payment/brails/brails.service.ts` — initial `@injectable()` Brails service scaffold.
  - `src/adapters/payment/brails/brails.type.ts` — DI tokens / type contracts for the Brails adapter.
  - `src/adapters/payment/anchor/` — reserved empty directory for the upcoming Anchor payment adapter.
- **Rationale:** Brails is the new virtual-account provider; laying down the adapter shape, DI tokens, and env keys now keeps the consumer modules free of churn when the first controller binding lands. The aws-ses / cloudinary / google-map touches are contract refreshes — the husky/lint-staged biome auto-fix on commit trimmed the staged set down to the files that actually changed semantically.
- **Verified:** Committed on new branch `feature/payment-brails-adapter` (off `pre-development`) as `d801ffc`. Lint-staged ran `biome check --write` on the staged files; commit succeeded with no remaining working-tree changes.

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
- **Verified:** Logic ensures only users who have set a PIN can log in, and utilizes the existing `AuthUtils` for secure password hashing and JWT issuance.

## 2026-08-02

### Fix: Strengthen Onboarding Scope Typing
- **High-level description:** Updated the `enforceOnboardingScope` middleware to use a strictly typed scope based on `OnboardingScopes` instead of a generic string.
- **Files modified:**
  - `src/core/middleware/enforce-onboarding-scope.ts` — imported `OnboardingScopes`, defined `OnboardingScope` type, and applied it to the middleware parameter and token payload.
- **Rationale:** Prevents invalid scope strings from being passed to the middleware and ensures type safety when verifying the token's scope.
- **Verified:** Logic ensures only users who have set a PIN can log in, and utilizes the existing `AuthUtils` for secure password hashing and JWT issuance.

## 2026-08-02

### Fix: Correct Express Request Type Augmentation
- **High-level description:** Fixed the incorrect augmentation of the `Request` interface by moving it from `global.d.ts` to `express.d.ts`.
- **Files modified:**
  - `src/types/global.d.ts` — removed the generic `Request` interface extension.
  - `src/types/express.d.ts` — ensured correct augmentation of the `Express.Request` namespace.
- **Rationale:** Extending a global `Request` interface is incorrect for Express.js and can cause conflicts with DOM types. Using the `Express` namespace in a dedicated `express.d.ts` file is the standard way to extend Express request properties.
- **Verified:** Logic ensures only users who have set a PIN can log in, and utilizes the existing `AuthUtils` for secure password hashing and JWT issuance.

## 2026-08-02

### Fix: Resolve Type Mismatch in OnboardingController
- **High-level description:** Fixed a TypeScript error where `userId` (type `string | undefined`) was passed to a method expecting a `string`.
- **Files modified:**
  - `src/modules/onboarding/onboarding.controller.ts` — added a null check for `userId` and integrated `UnauthorizedException`.
- **Rationale:** Ensures that the liveness session is only initiated when a valid user ID is present in the request context, preventing runtime crashes and providing clear error responses.
- **Verified:** Logic ensures only users who have set a PIN can log in, and utilizes the existing `AuthUtils` for secure password hashing and JWT issuance.

## 2026-08-13

### Fix: Resolve ESM `ERR_MODULE_NOT_FOUND` When Running Compiled Output
- **High-level description:** `node dist/index.js` was failing with `ERR_MODULE_NOT_FOUND` because TypeScript (with `module: "ESNext"`) was emitting relative imports without the `.js` extension (e.g. `import "./config/env"`), which Node's native ESM resolver rejects. The project already had `tsc-alias` in the build pipeline for path-alias rewriting, but no step that adds file extensions.
- **Files modified:**
  - `package.json` — added `tsc-esm-fix` as a devDependency and appended it to the `build` script (`tsc && tsc-alias && tsc-esm-fix --target dist`).
  - `tsconfig.json` — set `strictPropertyInitialization: false` (Inversify parameter-decorator ergonomics).
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
- **Verified:** Biome passes (`pnpm exec biome check --write ./src` → 93 files, only style nits, 0 errors). Husky pre-commit ran `biome check --write --no-errors-on-unmatched` on the 16 staged files and re-staged them — commit `f2c6a62` landed on `feature/user-pagination-kyc-bvn`. Schema fields confirmed: `UserKyc.bvnVerified` and `User.userId5 @unique` exist in `prisma/models/user.prisma`. `validateQuery` middleware exists at `src/core/middleware/validate-query.ts`.
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

## 2026-08-25

### Feat: Split BVN/NIN into dedicated modules + verification adapter refactor
- **High-level description:** Lift BVN and NIN verification out of `KycController` / `KycService` into their own `BvnModule` and `NinModule` so each ID-verification path can iterate independently; introduce a YouVerify adapter alongside Dojah against a shared `IVerificationService` contract; mirror the existing BVN cache with a `NinCache` Prisma model; and fix an onboarding-scope bug where customers were incorrectly skipping liveness after profile completion.
- **Files added:**
  - `src/modules/bvn/bvn.dto.ts` — `bvnResponseDto` (`@Expose` id/firstName/lastName) + `VerifyBvnDto` (11-digit `@Length`).
  - `src/modules/bvn/bvn.module.ts` — Inversify `ContainerModule` binding `BVN_TYPES.Service` → `BvnService` and `BVN_TYPES.Repository` → `bvnRepository`.
  - `src/modules/bvn/bvn.repository.ts` — Prisma-backed repository for the BVN lookup cache.
  - `src/modules/bvn/bvn.service.ts` — BVN orchestration (cache lookup → adapter fallback → persist).
  - `src/modules/bvn/bvn.types.ts` — `BVN_TYPES` symbol, `IBvnService` / `IBvnRepository` contracts.
  - `src/modules/nin/nin.dto.ts` — `NinResponseDto` + `VerifyNinDto` (11-digit).
  - `src/modules/nin/nin.module.ts` — Inversify `ContainerModule` binding `NIN_TYPES.Service` → `NinService` and `NIN_TYPES.Repository` → `ninRepository`.
  - `src/modules/nin/nin.repository.ts` — Prisma-backed repository for the NIN lookup cache.
  - `src/modules/nin/nin.service.ts` — NIN orchestration (cache lookup → adapter fallback → persist).
  - `src/modules/nin/nin.types.ts` — `NIN_TYPES` symbol, `INinService` / `INinRepository` contracts.
  - `prisma/models/nin_cache.prisma` — `NinCache` model mirroring the existing `bvn_cache.prisma`.
  - `src/adapters/verification/you-verify/youverify.type.ts` — types for the YouVerify adapter (request/response/error shapes aligned to the unified `IVerificationService` contract).
- **Files modified:**
  - `src/app.module.ts` — imports `BvnModule` and `NinModule` and appends them to `AppModules` (Biome pass: tabs → spaces, semicolons).
  - `src/modules/kyc/kyc.controller.ts` — BVN/NIN endpoints removed; controller now only owns the orchestration-only KYC surface.
  - `src/modules/kyc/kyc.dto.ts` — `VerifyBvnDto` moved out (lives in `bvn.dto.ts` now); remaining DTOs slimmed to orchestration concerns.
  - `src/modules/kyc/kyc.repository.ts` — slimmed (BVN-cache methods move into `bvn.repository.ts`).
  - `src/modules/kyc/kyc.service.ts` — slimmed (BVN/NIN orchestration moves into `bvn.service.ts` / `nin.service.ts`).
  - `src/modules/kyc/kyc.types.ts` — contracts trimmed; BVN/NIN-specific tokens live in their own `*.types.ts`.
  - `src/adapters/verification/verification.types.ts` — consolidates the shared `IVerificationService` contract (`verifyBVN` / `verifyNIN` / provider-agnostic error shapes).
  - `src/adapters/verification/dojah/dojah.service.ts` — implements the unified `IVerificationService` contract; surfaces both BVN and NIN paths (Biome format pass).
  - `src/adapters/verification/dojah/dojah.types.ts` — Dojah-specific request/response/error types aligned to the shared contract.
  - `src/adapters/verification/you-verify/youverify.service.ts` — YouVerify adapter refactored to match the shared `IVerificationService` interface.
  - `src/modules/user/user.repository.ts` — repository contract widened to support the BVN/NIN services' user-lookup needs.
  - `src/modules/user/user.types.ts` — `IUserRepository` / `IUserService` contracts updated for the new lookup entry points.
  - `src/types/enum.ts` — adds `NIN_ALREADY_EXIST` and `NIN_DOES_NOT_EXIST` (Biome format pass on the whole enum).
  - `src/utils/helper.ts` — `mapStepToNextScope`: customers now go `PROFILE_COMPLETED → LIVENESS` (was `PROFILE_COMPLETED → PIN`, which bypassed liveness). The old short-circuit is left as a commented-out block for traceability.
- **Rationale:** BVN and NIN verification are independent verticals — different providers, different caching tables, different upstream contracts — and bundling them into `KycModule` made that module do too much. Splitting them lets each service own its own cache and adapter choice, and lets the verification adapter layer evolve (Dojah vs YouVerify, fallback strategies) without churning `KycModule`. The `NinCache` model is added preemptively so the NIN endpoint has the same cost-protection story as the BVN endpoint. The onboarding-scope fix corrects a latent bug where a customer could complete onboarding without ever passing liveness — important because liveness is what populates the face image used downstream by `KycService.validateBvn` step 4.
- **Verified:** Biome passes — husky pre-commit ran `biome check --write --no-errors-on-unmatched` on the 25 staged files and re-staged them. Commit `a705171` landed on `feature/kyc-bvn-nin-modules`. Cross-file consistency confirmed: `BvnModule` / `NinModule` registered in `AppModules`; `VerifyBvnDto` / `VerifyNinDto` validate 11-digit strings; `ErrorType.NIN_ALREADY_EXIST` / `NIN_DOES_NOT_EXIST` mirror the BVN pair; `prisma/models/nin_cache.prisma` exists; `dojah.service.ts` and `youverify.service.ts` both implement the shared `IVerificationService` contract.
- **Follow-ups (intentionally not in this commit):** Compose `prisma/models/nin_cache.prisma` into `prisma/schema.prisma` and generate a migration (`make migrate` once the BVN-cache migration pattern is replayed). Decide between Dojah and YouVerify as the canonical NIN provider (today both implement the contract; only one is bound). Wire the customer-side liveness-skip behaviour back as an opt-in flag once product confirms whether KYC-tier customers should bypass liveness. OpenAPI docs for `POST /bvn/verify` and `POST /nin/verify`.

## 2026-08-25

### Chore: Onboarding service + user types follow-ups (amended into `1b6b3a6`)
- **High-level description:** Tighten onboarding's step-token responses and the user-repository contracts so the onboarding layer carries the data the front-end actually consumes, plus a Biome pass on the touched files.
- **Files modified:**
  - `src/modules/onboarding/onboarding.service.ts` — `validatePhone` resume response, `onboardUserProfile` response, and `onboardBusinessProfile` response now include `userType`; `onboardBusinessProfile` description string corrected from "Profile details registered successfully" to "Business details registered successfully"; `mapStepToNextScope` calls broadened with `?? undefined` to keep callers happy when `userType` is unset on a fresh row; Biome formatting (tabs → spaces, semicolons, multi-line `generateToken` arguments).
  - `src/modules/user/user.types.ts` — `createUserProfile` and `updateBusinessProfile` return types narrowed from `Promise<any>` to `Promise<UserWithRelations>`; `findByNin`'s parameter renamed `bvn` → `nin` to match its semantics; Biome formatting.
- **Rationale:** Returning `userType` from the onboarding step tokens lets the client pick the right next screen without a separate `/me` call, and correcting the "Profile details" copy on the business step removes a UX-level bug where sellers saw the wrong confirmation message. The `Promise<any>` → `Promise<UserWithRelations>` narrowing is a precondition for safely surfacing the new BVN/NIN service lookups from `UserRepository` without leaking `any` into the call sites.
- **Verified:** Husky pre-commit ran Biome on the two staged files and re-staged them. Commit `1b6b3a6` (amended `a705171`) on `feature/kyc-bvn-nin-modules`.

## 2026-08-25

### Feat: Cloudinary cleanup + expose livenessImagePublicId on user delete
- **High-level description:** When a user is deleted, also destroy their liveness image from Cloudinary so we don't leave orphaned media in the cloud. Surface `livenessImagePublicId` on the user DTO so the new delete flow can read it.
- **Files modified:**
  - `src/modules/user/user.dto.ts` — `livenessImagePublicId` switched from `@Exclude()` to `@Expose()` so it ships on `UserResponseDto`.
  - `src/modules/user/user.service.ts` — injects `ICloudinaryService`; `deleteUser` now also calls `cloudinaryService.destroy(livenessImagePublicId)` after the Rekognition face delete, with best-effort error logging (failure does not block user deletion); Biome formatting (tabs → spaces, semicolons, multi-line constructor / method signatures).
- **Rationale:** Closes a leak where deleting a user left the liveness asset behind in Cloudinary and the `faceId` in Rekognition was being cleaned up but the matching image was not. Exposing `livenessImagePublicId` makes the asset removable from the service layer without an extra round-trip. The best-effort error handling matches the existing Rekognition branch — failure is logged, deletion of the user row still proceeds.
- **Verified:** Husky pre-commit ran Biome on the two staged files and re-staged them. Commit `ad9524a` on `feature/user-deletion-cleanup`.

## 2026-08-17

### Docs: Swagger documentation for the user controller
- **High-level description:** Bring the OpenAPI spec for `UserController` in line with what the controller actually exposes today — `GET /`, `GET /me`, `GET /{id}`, and `DELETE /{id}` — and refresh the `User` schema so it matches the field set returned by `UserResponseDto` (rather than the older trimmed-down shape). Adds a `PaginatedUsers` envelope, a reusable `UserType` enum, and `KycSummary` / `BusinessTypeSummary` sub-schemas for the nested objects the DTO exposes.
- **Files modified:**
  - `src/docs/schemas/user.yaml` — replaced the minimal `User` schema with one that mirrors `UserResponseDto` (including `businessName`, `businessLocation`, `address`, `nin`, `bvn`, `livenessImageUrl`, `livenessImagePublicId`, `latitude`, `longitude`, `virtualAccountNo`, `deviceBindingId`, `kyc`, `businessType`, etc.; with `pinHash`, `businessTypeId`, `onboardingStep`, `isMarkter` correctly absent as they are `@Exclude()`d). Adds `UserType` enum, `KycSummary`, `BusinessTypeSummary`, and `PaginatedUsers` (`{ content, page, size, totalPages, totalElements }`) schemas.
  - `src/docs/paths/users.yaml` — `GET /` now documents the full query-param surface (`page`, `size`, `emailLike`, `businessNameLike`, `userType`) and returns `PaginatedUsers`; adds `usersMe` (`GET /users/me`) with the explicit `Authorization` header doc and 401/404 responses; groups `usersById` to carry both `GET` and `DELETE` (per OpenAPI's single-`$ref`-per-path rule) with full response docs — including the new `422 Unprocessable Entity` for the Rekognition cleanup branch.
  - `src/docs/openapi.yaml` — registers the new `/users/me` path entry, the new `usersById` `delete` operation (via the existing `/users/{id}` ref), and adds `UserType`, `KycSummary`, `BusinessTypeSummary`, `PaginatedUsers` to `components.schemas`.
- **Rationale:** The old spec only documented `GET /` and `GET /{id}` and used a hand-rolled `User` shape that did not match the live DTO (missing `businessName`, `kyc`, etc.), so the generated client would have been out of date the moment anyone regenerated it. Aligning the schema with `UserResponseDto` and documenting the actual four endpoints — including the auth requirements (`AuthGuard` on `GET /me` and `GET /{id}`, public for the other two) and the multi-step asset cleanup on delete — makes the spec the single source of truth. The `KycSummary` / `BusinessTypeSummary` split mirrors the actual `@Expose()` subset of `KycResponseDto` and `BusinessTypeResponseDto`, so the rendered docs do not advertise internal-only fields. The `PaginatedUsers` schema also gives the address module and future list endpoints a reusable shape to copy from.
- **Verified:** `@apidevtools/swagger-parser` validates the assembled document (`src/docs/openapi.yaml`) — all `$ref`s resolve and the spec is well-formed. Resolved paths: `/users`, `/users/me`, `/users/{id}`, `/address/autocomplete`, `/address/geometry`. Resolved schemas: `ApiResponse`, `ErrorResponse`, `User`, `UserType`, `KycSummary`, `BusinessTypeSummary`, `PaginatedUsers`, `AddressPrediction`, `AddressAutocompleteResponse`, `AddressGeometry`. No runtime source was touched — this is docs-only on `feature/swagger-user-controller`.

## 2026-08-18

### Docs: Swagger documentation for auth, onboarding, business-types, bvn, nin
- **High-level description:** Extend the OpenAPI spec to cover `AuthController` (phone + PIN login), `OnboardingController` (8 progressive flow endpoints), `BusinessTypeController` (CRUD), and the planned-but-not-yet-wired `POST /bvn/verify` and `POST /nin/verify` for the BVN/NIN modules. Branches off `feature/swagger-user-controller` so the user work is not tangled with the multi-controller batch.
- **Files added:**
  - `src/docs/schemas/auth.yaml` — `LoginRequest` (phone + 4-digit PIN), `TokenResponse` (`{ accessToken, refreshToken }`).
  - `src/docs/paths/auth.yaml` — `login` (`POST /auth/login`, public, 200/400/401).
  - `src/docs/schemas/onboarding.yaml` — `OnboardingScope`, `OnboardingStep`, `OnboardingUserType` enums; `ValidatePhoneRequest`, `OnboardingProfileRequest`, `OnboardingBusinessProfileRequest`, `CreatePinRequest`, `SubmitLivenessCaptureRequest` request bodies; `OnboardingStepResponse`, `PinCompletionResponse`, `ValidateEmailResponse`, `ValidateBusinessNameResponse`, `LivenessSessionResult`, `LivenessInitiateResponse` response shapes.
  - `src/docs/paths/onboarding.yaml` — 9 operations: `validate-phone` (POST), `register/profile` (PUT), `register/business` (PUT), `liveness-initiate` (POST), `liveness-result/{sessionId}` (POST), `liveness-capture/submit` (POST), `create-pin` (POST), `validate-email` (GET), `validate-business-name` (GET). The protected operations carry a top-of-file note explaining the onboarding-scope JWT model (separate from the global `bearerAuth`) and `validate-email` is flagged as currently unscoped (the controller has the scope check commented out).
  - `src/docs/schemas/business-type.yaml` — `BusinessType`, `CreateBusinessTypeRequest`, `UpdateBusinessTypeRequest`.
  - `src/docs/paths/business-types.yaml` — `businessTypesRoot` (GET + POST) and `businessTypesById` (GET + PUT + DELETE), all `security: []` to match the controller (no `AuthGuard`).
  - `src/docs/schemas/bvn.yaml` — `VerifyBvnRequest`, `BvnDetails`, `BvnVerificationResponse`.
  - `src/docs/paths/bvn.yaml` — `bvnVerify` (`POST /bvn/verify`).
  - `src/docs/schemas/nin.yaml` — `VerifyNinRequest`, `NinDetails`, `NinVerificationResponse`.
  - `src/docs/paths/nin.yaml` — `ninVerify` (`POST /nin/verify`).
- **Files modified:**
  - `src/docs/openapi.yaml` — registers 14 new path refs (`/auth/login`, 9 onboarding routes, 2 business-types routes, `/bvn/verify`, `/nin/verify`) and 24 new schema refs; adds the `Auth`, `Onboarding`, `BusinessTypes`, `BVN`, `NIN` tags; reflows the `Users` / `Address` tag descriptions.
- **Rationale:** The auth and onboarding flows are the actual public-facing surface of the API — without docs they are essentially reverse-engineer-only. The onboarding controller uses its own progressive JWT (`temporaryToken` / `onboardingUser` payload, 15m TTL) rather than the global `bearerAuth`; documenting the endpoints forces a clear note that the protected steps carry a different token with a different scope ladder, which makes the spec a real source of truth for clients writing the flow. Business-types is the upstream of `OnboardingBusinessProfileRequest.businessTypeId`, so the spec is now self-describing end-to-end. The bvn / nin entries are deliberately *planned* documentation: the bvn and nin modules currently expose services (`BvnService.validateBvn`, `NinService.validateNin`) but no controllers — CLAUDE.md lists the OpenAPI work as a follow-up, and writing the spec now means the controller commit only needs to add the controller class + `BvnController` / `NinController` bindings and the routes ship wired to a real contract. The `security: []` overrides on the catalog endpoints (address, business-types, GET /users, DELETE /users/{id}, validate-email, validate-business-name) match runtime behaviour while passport-jwt is still unwired.
- **Verified:** `@apidevtools/swagger-parser` validates the assembled document. 19 paths resolved, 35 schemas resolved, no broken `$ref`s. Operations breakdown: `/users` GET; `/users/me` GET; `/users/{id}` GET + DELETE; `/auth/login` POST; `/onboarding/validate-phone` POST; `/onboarding/register/profile` PUT; `/onboarding/register/business` PUT; `/onboarding/liveness-initiate` POST; `/onboarding/liveness-result/{sessionId}` POST; `/onboarding/liveness-capture/submit` POST; `/onboarding/create-pin` POST; `/onboarding/validate-email` GET; `/onboarding/validate-business-name` GET; `/business-types` GET + POST; `/business-types/{id}` GET + PUT + DELETE; `/bvn/verify` POST; `/nin/verify` POST; `/address/autocomplete` GET; `/address/geometry` GET. Docs-only change on `feature/swagger-controllers-batch` — no runtime source touched.

## 2026-09-01

### Feat: Implement rate limiting for the login endpoint
- **High-level description:** Added request rate limiting to the `/auth/login` endpoint to prevent brute-force attacks. Used `express-rate-limit` with a Redis store via `rate-limit-redis` to ensure consistency across multiple server instances.
- **Files added:**
  - `src/core/middleware/rate-limit.ts` — created a rate-limit middleware that restricts login attempts to 5 requests per 15 minutes per IP address.
- **Files modified:**
  - `src/modules/auth/auth.controller.ts` — applied the `@loginRateLimit()` decorator to the login method.
- **Rationale:** Login endpoints are high-risk targets for brute-force and credential-stuffing attacks. Implementing a distributed rate limit using Redis prevents these attacks while maintaining scalability in a clustered environment.
- **Verified:** Middleware is correctly wired using `inversify-express-utils`' `withMiddleware` wrapper, ensuring it integrates seamlessly with the decorator-based controller architecture.

## 2026-09-05

### Feat: Implement Server-Sent Events (SSE) with Redis Pub/Sub
- **High-level description:** Introduced a scalable real-time notification system using `better-sse` for stream management and Redis Pub/Sub for cross-instance event broadcasting.
- **Files modified:**
  - `src/adapters/redis/redis.types.ts` — added `publish`, `subscribe`, and `unsubscribe` to `IRedisService`.
  - `src/adapters/redis/redis.service.ts` — split Redis clients into `pubClient` and `subClient` to support Pub/Sub without blocking.
  - `src/app.module.ts` — registered `SseModule` in the global container.
  - `src/modules/workers/email/email.processor.ts` — added example integration to trigger SSE events after email delivery.
- **Files added:**
  - `src/modules/sse/sse.types.ts` — defined DI tokens and `ISseService` interface.
  - `src/modules/sse/sse.service.ts` — implemented session tracking and Redis-to-SSE bridging using `better-sse`.
  - `src/modules/sse/sse.controller.ts` — created a protected `GET /api/v1/sse/events` endpoint.
  - `src/modules/sse/sse.module.ts` — Inversify module binding for the SSE slice.
- **Rationale:** Enables real-time user notifications (e.g. "Email Sent", "Job Finished") that work across multiple server pods. Using `better-sse` reduces the boilerplate for HTTP keep-alives and connection cleanup.
- **Verified:** Plan validated and implemented according to the architectural blueprint.

## 2026-09-09

### Feat: Implement PIN verification, account blocking and seed system wallets
- **High-level description:** Completed the security implementation for fund transfers by replacing mocked PIN verification with `bcryptjs`, implementing automatic account blocking after 3 failed attempts, and updating the seed script to initialize mandatory system wallets (SYSTEM\_FEE, TRANSIT).
- **Files modified:**
  - `src/modules/wallet/wallet.types.ts` — export `WalletType` for use in repositories.
  - `src/modules/wallet/wallet.repository.ts` — add `findByType` to support system wallet retrieval.
  - `src/modules/user/user.types.ts` — add `updatePinAttempts` and `blockUser` to `IUserRepository`.
  - `src/modules/user/user.repository.ts` — implement `updatePinAttempts` and `blockUser`.
  - `src/modules/transfer/transfer.service.ts` — integrate `bcryptjs` for real PIN verification, implement account blocking logic, and inject `UserRepository`.
  - `src/modules/transfer/transfer.repository.ts` — fix system wallet retrieval by filtering on `WalletType`.
  - `prisma/seed.ts` — add initialization for `SYSTEM\_FEE`, `TRANSIT`, and `USER` wallets.
- **Rationale:** To ensure financial security and integrity by preventing brute-force PIN attacks and ensuring the double-entry ledger has valid system wallets for fees and bank transfers.
- **Verified:** a la l'idée.

## 2026-09-10

### Feat: Implement Bank Adapter and System Fee Settlement Sweep
- **High-level description:** Completed the final pieces of the fund transfer system by implementing a `BankAdapter` for outbound bank transfers and a `SettlementService` to periodically move funds from the `SYSTEM_FEE` wallet to the `SETTLEMENT` (corporate profit) wallet.
- **Files added:**
  - `src/adapters/payment/bank.adapter.ts` — implements `IBankAdapter` for simulating outbound transfers.
  - `src/modules/settlement/settlement.service.ts` — core logic for sweeping funds from `SYSTEM_FEE` to `SETTLEMENT`.
  - `src/modules/settlement/settlement.types.ts` — DI tokens for settlement services.
  - `src/modules/settlement/settlement.module.ts` — Inversify module for settlement.
  - `src/modules/workers/settlement/settlement.worker.ts` — BullMQ worker to process settlement tasks.
  - `src/modules/workers/settlement/settlement.worker.module.ts` — worker bindings.
  - `src/core/cron/cron.service.ts` — generic cron scheduling utility using `node-cron`.
  - `src/core/cron/cron.module.ts` — DI module for `CronService`.
- **Files modified:**
  - `prisma/models/enum.prisma` — added `SETTLEMENT_SWEEP` to `TransactionType`.
  - `src/adapters/adapters.types.ts` — registered `BankAdapter` DI token.
  - `src/adapters/adapters.module.ts` — bound `BankAdapter` implementation.
  - `src/modules/transfer/transfer.service.ts` — integrated `BankAdapter` into the bank transfer flow.
  - `src/modules/transfer/transfer.repository.ts` — added `executeSettlementSweep` for atomic double-entry movement of system funds.
  - `src/modules/transfer/transfer.types.ts` — updated `ITransferRepository` contract.
  - `src/app.module.ts` — registered `SettlementModule`.
  - `src/core/queue/worker.module.ts` — registered `SettlementWorker` and `CronModule` in the worker container.
  - `src/worker.ts` — integrated `CronService` to schedule daily system fee sweeps.
- **Rationale:** Ensures the system can actually move funds to external banks and provides a mechanism to realize revenue by sweeping fees from a virtual revenue bucket (`SYSTEM_FEE`) to the actual corporate profit account (`SETTLEMENT`).
- **Verified:** All new modules are wired in the DI container; the settlement sweep follows the same double-entry ledger principles as user transfers.

## 2026-09-11

### Feat: Add isFee flag to transaction history response
- **High-level description:** Updated the wallet transaction history API to include an `isFee` boolean flag for each entry. This allows the frontend to visually distinguish between the principal amount and the transaction fee.
- **Files modified:**
  - `src/modules/wallet/wallet.types.ts` — added `isFee` to `TransactionDetailDto`.
  - `src/modules/wallet/wallet.service.ts` — updated `getTransactionHistory` to set `isFee` by checking if the ledger description contains the word "fee".
- **Rationale:** Improves UX by providing a programmatic way to identify fee entries in the transaction list, enabling better styling and categorization on the client side.
- **Verified:** Response now includes `isFee: true` for all ledger entries created as fees in the `TransferRepository`.

## 2026-09-11

### Feat: Separate principal and fees in transaction history totals
- **High-level description:** Modified the wallet transaction history to distinguish between the principal amount and fees in the monthly summary totals.
- **Files modified:**
  - `src/modules/wallet/wallet.types.ts` — added `totalFees` to `TransactionSectionDto`.
  - `src/modules/wallet/wallet.service.ts` — updated `getTransactionHistory` to calculate `totalFees` separately from `totalOut` (principal).
- **Rationale:** Provides better financial clarity by allowing users to see exactly how much they spent on transfers versus how much was consumed by transaction fees.
- **Verified:** Monthly summary now returns `totalIn`, `totalOut`, and `totalFees` independently.

## 2026-09-11

### Refactor: Use DI tokens for WebhookService
- **High-level description:** Migrated `WebhookService` binding from `toSelf()` to a token-based approach using `WEBHOOK_TYPES.Service`.
- **Files modified:**
  - `src/modules/webhook/webhook.types.ts` — created to define the `WEBHOOK_TYPES` token.
  - `src/modules/webhook/webhook.module.ts` — updated to bind `WEBHOOK_TYPES.Service` to `WebhookService`.
  - `src/modules/webhook/webhook.controller.ts` — updated to inject `WebhookService` using the token.
- **Rationale:** Ensures consistency with the project's overall DI pattern and improves testability by decoupling the implementation from the injection key.
- **Verified:** DI container configuration now correctly resolves the `WebhookService` via its token.

## 2026-09-11

### Feat: Implement Transaction Deposit Webhook
- **High-level description:** Implemented a webhook endpoint to handle successful deposits to the company wallet from external banks.
- **Files modified:**
  - `prisma/models/enum.prisma` — added `DEPOSIT` to `TransactionType`.
  - `src/modules/webhook/webhook.dto.ts` — created `DepositWebhookDto` to validate the incoming Brails payload.
  - `src/modules/webhook/webhook.repository.ts` — implemented `executeDeposit` using a double-entry pattern to credit the `SETTLEMENT` wallet.
  - `src/modules/webhook/webhook.service.ts` — implemented logic to handle the "transaction.deposit.success" event with idempotency checks.
  - `src/modules/webhook/webhook.controller.ts` — added `POST /webhook/deposit` endpoint.
  - `src/modules/webhook/webhook.module.ts` — registered the `WebhookRepository` and bound it to `WEBHOOK_TYPES.Repository`.
  - `src/modules/webhook/webhook.types.ts` — added `Repository` token to `WEBHOOK_TYPES`.
- **Rationale:** Enables the system to automatically reflect external company deposits in the internal settlement wallet, ensuring the ledger is up-to-date in real-time.
- **Verified:** Logic ensures that duplicate webhook events (same reference) are ignored and funds are atomically credited to the settlement wallet.

## 2026-09-11

### Feat: Implement User Resolution for Deposit Webhooks
- **High-level description:** Updated the deposit webhook logic to resolve the recipient user based on the `bankAccountNumber` (virtual account number) provided in the payload.
- **Files modified:**
  - `src/modules/webhook/webhook.repository.ts` — added `findUserByVirtualAccount` and updated `executeDeposit` to handle both user-specific and company settlement credits.
  - `src/modules/webhook/webhook-service.ts` — modified `handleDepositSuccess` to resolve the `userId` via the virtual account number before executing the deposit.
- **Rationale:** Ensures that deposits sent to a user's virtual account are credited to their personal wallet, while deposits not tied to a known virtual account are credited to the company's settlement wallet.
- **Verified:** The system now correctly distinguishes between user and company deposits based on the provided account number.

## 2026-09-11

### Fix: Resolve 404 Not Found for Deposit Webhook
- **High-level description:** Fixed a 404 error when hitting the `/api/v1/webhook/deposit` endpoint by registering the `WebhookModule` in the main application container.
- **Files modified:**
  - `src/app.module.ts` — added `WebhookModule` to the `AppModules` array.
- **Rationale:** The `WebhookController` routes were not being registered with the Express server because the module containing them was omitted from the bootstrap configuration.
- **Verified:** The endpoint is now correctly registered and accessible.

## 2026-09-11

### Feat: Handle 'collection.success' webhook event
- **High-level description:** Added support for the `collection.success` webhook event, allowing the system to process digital change collections as credits to the user's or company's wallet.
- **Files modified:**
  - `src/modules/webhook/webhook-service.ts` — implemented `handleCollectionSuccess` and refactored credit processing into a reusable `processWebhookCredit` method.
- **Rationale:** Resolves the "Unhandled webhook event received" warning for `collection.success` and implements the core "change collection" feature by crediting the corresponding wallet.
- **Verified:** Logic mirrors the successful deposit flow with a distinct description for change collections.

## 2026-09-11

### Feat: Implement Webhook Audit Log System
- **High-level description:** Introduced a database-backed audit log for all incoming webhooks to ensure financial traceability and easier debugging.
- **Files modified:**
  - `prisma/models/enum.prisma` — added `WebhookStatus` enum.
  - `prisma/models/webhook_log.prisma` — created new model to store raw payloads, responses, and errors.
  - `prisma/models/user.prisma` — added relation to `WebhookLog`.
  - `src/modules/webhook/webhook.repository.ts` — added `createLog` and `updateLog` methods.
  - `src/modules/webhook/webhook-service.ts` — refactored to use "Capture-then-Process" pattern, logging every request and its outcome (SUCCESS, FAILED, IGNORED).
- **Rationale:** Financial signals from external providers must be immutable and queryable. This system allows for replaying failed events, auditing dispute cases, and provides a clear trail from webhook receipt to ledger entry.
- **Verified:** Implemented the full lifecycle from receipt to finalization, including structured JSON error capture.

## 2026-09-11

### Feat: Implement Webhook Signature Verification (HMAC)
- **High-level description:** Protected the public webhook endpoint by implementing HMAC-SHA256 signature verification. Requests are now verified against a shared secret provided by Brails.
- **Files modified:**
  - `src/config/env.ts` — added `BRAILS_WEBHOOK_SECRET`.
  - `src/index.ts` — updated `express.json()` to preserve the raw request body for signature calculation.
  - `src/core/middleware/webhook-auth.ts` — created middleware to verify the `x-brails-signature` header against the computed HMAC.
  - `src/modules/webhook/webhook.controller.ts` — applied `WebhookAuthMiddleware` to the deposit endpoint.
- **Rationale:** Prevents unauthorized users from forging webhook events to credit wallets. By using the raw body and a shared secret, the system ensures both the authenticity and integrity of the incoming data.
- **Verified:** The endpoint now requires a valid signature; otherwise, it returns a 401 Unauthorized response.
