# Change Log

## 2026-07-30

### Refactor: Rename `infrastructure/` → `adapters/` (folder, module, token)

- **High-level description:** Renamed the entire `src/infrastructure/` tree to `src/adapters/` because the folder holds third-party service wrappers (Anchor, Cloudinary, Google Maps, AWS Rekognition), not generic infrastructure. Renamed the module class `InfrastructureModule` → `AdaptersModule` and the token object `INFRA_TYPES` → `ADAPTER_TYPES` for consistency. Also dropped the leading-space typo in ` infrastructure.module.ts` along the way.
- **Files modified:**
  - `src/infrastructure/` → `src/adapters/` (entire tree moved via `git mv`; tracked rename ratio near 100% for all 9 files).
  - `src/adapters/adapters.types.ts` — `INFRA_TYPES` → `ADAPTER_TYPES`; entries unchanged (`AnchorApiSdk`, `GoogleMapsService`, `AwsRekognitionService`).
  - `src/adapters/adapters.module.ts` — `InfrastructureModule` → `AdaptersModule`; binds `IGoogleMapsService` against `ADAPTER_TYPES.GoogleMapsService`; imports sorted.
  - `src/app.module.ts` — imports `AdaptersModule` from `./adapters/adapters.module`; registered in `AppModules`; Biome format (drop trailing semicolons, trailing newline).
  - `src/modules/address/address.service.ts` — imports `@/adapters/adapters.types` and `@/adapters/google/google-map.type`; uses `ADAPTER_TYPES.GoogleMapsService`.
  - `CLAUDE.md` — bootstrap step 3, module layout, cross-cutting concerns, the adapter-modules section, and the Current State snapshot updated to use `AdaptersModule` / `ADAPTER_TYPES` / `src/adapters/`. Added an `aws-rekognition/` entry noting the compareFaces stub still needs a binding in `adapters.module.ts`.
  - `src/adapters/aws-rekognition/aws-rekogniction.type.ts` (new, was untracked) — empty placeholder, filename typo retained per user direction.
  - `src/adapters/aws-rekognition/aws-rekognition.service.ts` (new, was untracked) — duplicate of the tracked `aws-rekognition.ts` with tabs/no-semicolons formatting; kept per user direction.
- **Rationale:** Match the code to what it does (hexagonal-style adapter layer between the domain and external SDKs). Unify naming across folder, module class, and exported symbol so future readers don't have to remember the rename.
- **Verified:** `tsc --noEmit` clean. `biome check` reports 0 errors; 4 pre-existing `noUnusedPrivateClassMembers` warnings on the rekognition stubs are out of scope.

### Feat: Address `/geometry` endpoint, AWS Rekognition skeleton, infra token rename

- **High-level description:** Extended the address module with a Place Details geometry lookup, added an AWS Rekognition wrapper as scaffolding for face comparison, renamed the infrastructure DI token object to `INFRA_TYPES` (with a new `AwsRekognitionService` symbol), disabled the Express server timeout for long-running calls, and bumped Prisma + AWS SDK deps. Also reformatted `tsconfig.json` (2-space indent) and added a `prisma/seed.ts` plus Makefile `db-gen` / `seed` targets.
- **Files modified:**
  - `src/infrastructure/infrastructure.types.ts` — `TYPES` → `INFRA_TYPES`, added `AwsRekognitionService: Symbol.for("AwsRekognitionService")`.
  - `src/infrastructure/ infrastructure.module.ts` — binds `IGoogleMapsService` against `INFRA_TYPES.GoogleMapsService`; switched to semicolons + 2-space indent.
  - `src/infrastructure/google/google-map.type.ts` — added `IPlaceDetails` interface (geometry, address_components, formatted_address, etc.); typed `getPlaceDetails` on `IGoogleMapsService`.
  - `src/infrastructure/google/google-map.service.ts` — `getPlaceDetails(placeId, fields?)` now returns the typed `IPlaceDetails` payload (was returning `res` raw); formatting normalized.
  - `src/infrastructure/aws-rekognition/aws-rekognition.ts` (new) — `AwsRekognition` injectable wrapping `@aws-sdk/client-rekognition` with `compareFaces()` stub. **Not yet bound in `InfrastructureModule`** — symbol and dependency are in place but the binding still needs wiring.
  - `src/common/injectable/service.ts` — removed the unused `logService` decorator export.
  - `src/index.ts` — `serverInstance.timeout = 0` after the InversifyExpressServer build so long-running calls aren't cut off.
  - `src/modules/address/address.type.ts` — exported `TGetLocationAddress`; `IAddressService.getLocationAddress` now returns `Promise<TGetLocationAddress[]>`; added `getLocationGeometry(placeId: string)`.
  - `src/modules/address/address.service.ts` — `getLocationAddress` returns typed predictions; new `getLocationGeometry(placeId)` validates input and calls `getPlaceDetails(placeId, "geometry")`, returning `result.result.geometry`.
  - `src/modules/address/address.controller.ts` — added `GET /geometry?placeId=...` returning `ApiResponse.success(...)`.
  - `src/modules/user/user.controller.ts` — added `POST /users/validate` echoing the validated body.
  - `src/modules/user/user.dto.ts` — new `UserPhoneRequest` class with `phoneNumber: string` field.
  - `Makefile` — added `db-gen` (`pnpm prisma generate`) and `seed` (`pnpm prisma db seed`) targets.
  - `prisma/seed.ts` (new) — seeds a single demo user via `PrismaPg` driver adapter. **Caveat:** imports `../src/generated/prisma/client`, which doesn't match the current `generator client { output = "../src/generated/prisma" }` — needs to be repointed once the schema is composed and the client is regenerated.
  - `package.json` — added `@aws-sdk/client-rekognition ^3.1097.0`; bumped `@prisma/client` and `prisma` to `^7.9.1`.
  - `pnpm-lock.yaml` — updated to match `package.json`.
  - `tsconfig.json` — re-indented from tabs to 2 spaces (semantic content unchanged).
- **Rationale:** Make `/address/geometry` available to clients (mirrors Google's Place Details API for downstream reverse-geocoding) and prepare the project for face-comparison flows via AWS Rekognition. Renaming the token object to `INFRA_TYPES` avoids collision with the global `TYPES` map in `src/types/di-types.ts`. Disabling the server timeout and removing the unused `logService` decorator are small cleanups that came along for the ride.

## 2026-07-29

### Docs: Sync `CLAUDE.md` to current codebase state

- **High-level description:** Updated the project `CLAUDE.md` so its bootstrap flow, module layout, infrastructure wiring, and API surface match the code today. The previous copy still described the bootstrap as wiring only `UserModule` + `LoggerModule` and listed `address/*`, `auth/*`, `Anchor`, and `Cloudinary` as "to be implemented" — all of which are actually wired now. Also added a note that no test runner is configured yet, and pointed the Conventions section at the new `ApiResponse` envelope and the `.types.ts` naming convention.
- **Files modified:**
  - `CLAUDE.md` — bootstrap step 3 now lists `UserModule`, `LoggerModule`, `InfrastructureModule`, `AddressModule`; module layout reflects the `*.types.ts` migration (with `*.interfaces.ts` as the optional split) and uses `address/` as the canonical example; cross-cutting concerns now mention `ApiResponse<T>` from `src/utils/http-response.ts` and the unified `infrastructure.types.ts`; infrastructure section notes `InfrastructureModule` is wired in `app.module.ts` and lists `google/` (Places autocomplete) with the `{ predictions }` payload shape; API surface lists `/api/v1/users`, `/api/v1/auth`, `/api/v1/address/autocomplete`; Current State snapshot reflects what is actually working vs. still stubbed; added a "Tests" subsection under Common Commands noting there is no `test` script in `package.json`.
- **Rationale:** Future Claude Code sessions should be able to read `CLAUDE.md` and immediately know which modules are wired, which naming convention to follow for new DI files, and where the response helper lives. The previous copy would have misled a session into thinking `address` and `auth` were not yet wired.

### Refactor: Rename `*.contract.ts` → `*.types.ts` and fix Google Maps integration

- **High-level description:** Renamed DI contract files to a consistent `*.types.ts` naming across infrastructure and user modules. Updated `GoogleMapsService` to return the full prediction payload, and refactored the address autocomplete flow to use a new shared `ApiResponse` helper with proper validation and a curated response shape.
- **Files modified:**
  - `CLAUDE.md` — added documentation/change-tracking policy (plans go in `_plans/`, log changes in `.dev_history/change_log.md`).
  - `src/infrastructure/infrastructure.types.ts` (new) — replaced `infrastructure.token.ts` with the same `TYPES` map (`AnchorApiSdk`, `GoogleMapsService`).
  - `src/infrastructure/ infrastructure.module.ts` — updated import path to `infrastructure.types`.
  - `src/infrastructure/cloudinary/cloudinary.types.ts` (new) — moved `ICloudinaryService` interface from `cloudinary.contract.ts`.
  - `src/infrastructure/cloudinary/cloudinary.service.ts` — import updated to `cloudinary.types`.
  - `src/infrastructure/google/google-map.service.ts` — `getPlacePredictions` now returns the full `{ predictions }` payload (was returning `.predictions`); formatting normalized.
  - `src/infrastructure/google/google-map.type.ts` — flattened `IPlacePrediction` shape (removed the wrapping `predictions` key) and updated `IGoogleMapsService` return type accordingly.
  - `src/infrastructure/anchor-api-sdk/anchor.types.ts` (new) — moved anchor SDK interfaces from `anchor.contract.ts`.
  - `src/modules/user/user.types.ts` (new) — moved `USER_TYPES` symbols from `user.tokens.ts`.
  - `src/modules/address/address.controller.ts` — endpoint renamed `/predictions` → `/autocomplete`; response now wrapped via `ApiResponse.success(...)` with explicit `200` status.
  - `src/modules/address/address.service.ts` — added `search` empty-string validation (throws `BadRequestException`); maps Google prediction payload to a slim `{ placeId, description, mainText, secondaryText }` shape.
  - `src/utils/http-response.ts` (new) — generic `ApiResponse<T>` helper with `success` / `error` static factories.
- **Rationale:** Unify naming for DI token/type files (`*.types.ts`) to remove confusion between tokens and contracts. Fix the address autocomplete flow so the controller returns the proper payload and the service validates input and shapes a clean DTO for clients. Introduce a reusable `ApiResponse` wrapper to standardize API responses. Update CLAUDE.md to formalize plans storage and change-log tracking.
