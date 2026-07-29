# Change Log

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
