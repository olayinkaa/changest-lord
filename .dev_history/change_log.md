# Change Log

## 2026-07-29

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
