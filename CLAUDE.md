# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MyChange Backend** — A digital financial platform that lets users collect, save, and spend their transaction change digitally via mobile app / USSD (`*7006*86#`) / POS terminals. Key features: digital change collection, "Keep Plan" savings (up to 15% interest), merchant ecosystem, and direct vendor payments.

## Tech Stack

- **Runtime**: Node.js v22.22.3, pnpm@10.6.3
- **Language**: TypeScript 7 (ESM, `type: "module"`)
- **Framework**: Express 4 with `inversify-express-utils` for decorator-based controllers
- **DI**: Inversify 6 (with experimental decorators, container modules)
- **ORM**: Prisma 7 with `@prisma/adapter-pg` (PostgreSQL)
- **Validation**: Zod (env) + class-validator / class-transformer (DTOs)
- **Logging**: Pino (with `pino-http`, `pino-pretty` in dev)
- **Auth**: passport, passport-jwt, jsonwebtoken, bcryptjs
- **Other**: helmet, cors, multer, cloudinary, axios
- **Linter/Formatter**: Biome 2.5.5 (tabs, double quotes, semicolons as needed)

## Common Commands

All commands run from the repo root. The Makefile wraps the most common ones.

### Development
```sh
pnpm run dev:local       # watch mode with .env.local (most common)
pnpm run dev:staging     # watch mode with .env.staging
make dev                 # alias for pnpm run dev (uses .env)
make secret              # generate a JWT secret: openssl rand -base64 32
```

### Build & Run
```sh
pnpm run build           # tsc + tsc-alias → dist/
pnpm run start           # node dist/index.js
pnpm run dev:clean       # rm -rf dist
```

### Lint / Format
```sh
pnpm run lint:check:fix  # biome check --write ./src (also runs via husky pre-commit on staged files)
```

### Tests
There is no test runner configured yet — no `test` script in `package.json`. Add one (e.g. Vitest) before introducing test suites.

### Database (Prisma)
```sh
make migrate             # interactive: prompts for migration name, then prisma migrate dev --name <name>
make rm-migration        # rm -rf prisma/migrations
make drop-db             # prisma migrate reset --force
pnpm exec prisma generate   # regenerate client (output: src/generated/prisma)
```

The Prisma schema entrypoint is `prisma/schema.prisma`, which should compose models from `prisma/models/*.prisma` (e.g. `user.prisma`, `enum.prisma`). Generated client lives at `src/generated/prisma` — it is committed-friendly code but should be regenerated after schema changes. Currently `prisma/schema.prisma` only declares `datasource db` and `generator client` — the per-model files in `prisma/models/` exist but are not yet composed into the schema.

### Hooks
Husky pre-commit hook runs via `lint-staged` (see `lint-staged.config.js`). `pnpm install` triggers `prepare` automatically.

## Environment Setup

Copy `.env.example` to `.env.local` (or `.env.staging`) and fill in:

- `DATABASE_URL` — Postgres connection string (required, no default)
- `JWT_TOKEN_SECRET` — min 32 chars; generate with `make secret` / `openssl rand -base64 32`
- `SERVICE_PORT` — defaults to 6001 (capped at 8000)
- `NODE_ENV` — `development` | `staging` | `production`
- `SERVICE_NAME` — defaults to `myChange-Service`
- `LOG_LEVEL` — `trace` | `debug` | `info` | `warn` | `error` | `fatal`
- `JWT_TOKEN_EXPIRES_IN` — defaults to `30m` (see `src/constants/index.ts`)

Env is validated at boot via Zod (`src/config/env.ts` + `src/utils/env.ts`). The process exits if validation fails.

## Architecture

### Bootstrap flow (`src/index.ts`)
1. Import `reflect-metadata` (required for Inversify decorators).
2. `Application` abstract class (`src/utils/application.ts`) creates an Inversify `Container` (default scope: `Singleton`) and calls abstract `configureService()` and `setup()`.
3. `App.configureService` loads all `AppModules` from `src/app.module.ts` (currently `UserModule`, `LoggerModule`, `AdaptersModule`, `AddressModule`, `BusinessTypeModule`, `LivenessModule`) into the container.
4. `App.setup`:
   - Connects Prisma (`prisma.$connect`); exits on failure.
   - Builds an `InversifyExpressServer` rooted at `/api/v1`.
   - Wires `express.json`, CORS, helmet, `pino-http` request logging.
   - Wires global `errorHandler` from `src/core/errors/error-handler.ts`.
   - Listens on `SERVICE_PORT`; handles `SIGTERM` / `SIGINT` for graceful shutdown.

### Module layout (Inversify `ContainerModule` pattern)
Each domain under `src/modules/<name>/` follows the same shape:
- `<name>.module.ts` — exports a `new ContainerModule((bind) => ...)` that binds controller/service/repository.
- `<name>.controller.ts` — decorated with `@controller("/path")`; methods use `@httpGet`, `@httpPost`, etc.
- `<name>.service.ts` — `@injectable()`; depends on repository.
- `<name>.repository.ts` — `@injectable()`; wraps Prisma access.
- `<name>.dto.ts` — `class-validator` DTOs validated via `@validateSchema(DtoClass)`.
- `<name>.types.ts` — `Symbol.for(...)` DI tokens used in `@inject(TYPES.X)` and service/repository interfaces. (Naming convention migrated from the older `*.tokens.ts` + `*.contracts.ts` split.)
- `<name>.interfaces.ts` (optional) — additional contracts split out from `types.ts` when the file grows.

Currently wired domains: `user/`, `auth/`, `address/`, `business-type/`, `liveness/`. The `address` module is an example of the newer slice — it owns `address.module.ts`, `address.controller.ts`, `address.service.ts`, and `address.type.ts`, with no repository layer (it composes `GoogleMapsService` from the adapters layer).

### Cross-cutting concerns
- **DI tokens**: `src/types/di-types.ts` holds global `TYPES` (currently just `Logger`). Per-module tokens go in `<module>.types.ts`. Adapter-layer tokens are unified in `src/adapters/adapters.types.ts` (`ADAPTER_TYPES`).
- **Logger**: `src/config/pino-logger.ts` exports `pinoLogger` (singleton) and a `LoggerModule` that binds `TYPES.Logger` to a request-scoped child logger (each request gets a `requestId`). Inject as `private logger: pino.Logger` in controllers. The `logService` decorator (`src/common/injectable/service.ts`) is provided for use on services/properties.
- **Validation**: `validateSchema(DtoClass)` (`src/core/middleware/validate-schema.ts`) is applied as `withMiddleware(...)` to controller methods. It uses `class-transformer` + `class-validator` with `whitelist` + `forbidNonWhitelisted`. The validated DTO instance replaces `req.body`.
- **Errors**: throw `HttpException` subclasses from `src/core/errors/exceptions.ts` (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`). The global handler in `error-handler.ts` serializes them as `{ code, status: "error", message, data? }`. Unknown errors become 500.
- **API responses**: standardize on `ApiResponse<T>` from `src/utils/http-response.ts` (`ApiResponse.success(...)` / `ApiResponse.error(...)`). Controllers should wrap outgoing payloads in this shape rather than returning raw values.
- **CORS**: `src/config/cors.ts` whitelists localhost ports 3000/5005/5173/4006 with credentials.
- **Prisma client**: `src/core/database/db.ts` exports a shared `prisma` instance (driver-adapter for Postgres) that hot-reloads in dev via `globalThis`.

### Adapter modules (`src/adapters/`)
Wired via `AdaptersModule` (see `src/adapters/adapters.module.ts`) and exported from `src/app.module.ts`.
- `anchor-api-sdk/` — Anchor API client (banks, virtual accounts, transfers, airtime, data) with ambient types in `src/types/global.d.ts` (`AnchorBank`, `AnchorVirtualAccount`, etc.).
- `cloudinary/` — image upload service + interface.
- `google/` — Google Maps Places autocomplete. `GoogleMapsService.getPlacePredictions(input)` returns `{ predictions }`; downstream code (e.g. `AddressService`) flattens to `{ placeId, description, mainText, secondaryText }`.
- `aws-rekognition/` — `@aws-sdk/client-rekognition` wrapper (`AwsRekognition` injectable). `compareFaces()` is currently a stub — binding in `adapters.module.ts` still to be added when the first caller is in place.

### Skills
`skills-lock.json` pins Prisma-related skills (CLI, client API, compute, database setup, driver adapter, MongoDB/Postgres upgrades). Use `context7` for ad-hoc library docs and the `prisma-*` skills for any Prisma operation.

### Path alias
`@/*` maps to `./src/*` (see `tsconfig.json`). Use it for cross-folder imports, e.g. `import { config } from "@/config/env"`.

## Code Conventions

- Biome enforces tabs, double quotes, 90-char line width, no semicolons where optional. Organize imports is on (see `biome.json`). `unsafeParameterDecoratorsEnabled` is enabled so Inversify parameter decorators work.
- Controllers are thin; put business logic in `*.service.ts`.
- Always throw `HttpException` subclasses (not raw `Error`) so the error handler renders them correctly.
- New domain code goes in `src/modules/<name>/` with the standard files; bind via a `ContainerModule` and add it to `src/app.module.ts`.
- Per-module DI tokens and interfaces live in `*.types.ts` (migrated from the older `*.tokens.ts` + `*.contracts.ts` split; prefer `*.types.ts` for new modules).
- Use `validateSchema(DtoClass)` decorator on any controller method that accepts a body.
- Wrap response payloads in `ApiResponse.success(...)` from `src/utils/http-response.ts` so every endpoint returns a consistent envelope.
- For Prisma schema additions, add a new file under `prisma/models/` and ensure it's referenced from `prisma/schema.prisma` (currently the schema is minimal — only `datasource db` and `generator client` — so new models need to be wired in).
- Logs: `pinoLogger` already redacts `req.headers.authorization`, `password`, and `pin` — keep secrets out of other log fields.

## API Surface

Base path: `/api/v1`. Example: `UserController` mounts at `/api/v1/users` (from `@controller("/users")` + `rootPath: "/api/v1"`). Currently exposed slices: `users`, `auth`, `address`, `business-type`, `liveness` (the `address` autocomplete endpoint is `/api/v1/address/autocomplete`).

## Current State (snapshot)

- Working: bootstrap, DI container, Prisma connection, request logger, error handler, CORS, validation, `UserController`, `AuthController`, `AddressController` (autocomplete + geometry via Google Maps), `BusinessTypeController`, `LivenessController`, `AdaptersModule` (Anchor / Cloudinary / Google Maps / AWS Rekognition skeleton), `ApiResponse` envelope.
- Stubs / to be implemented: Prisma schema is not yet composed (per-model files exist in `prisma/models/` but `schema.prisma` doesn't reference them); `user.service.ts` / `user.repository.ts` / `auth.repository.ts` are skeleton files; Passport JWT strategy not yet wired; Swagger URL is referenced in the README but not yet wired in code.

### Documentation & Planning
- All technical plan or plans must be stored in the `_plans/` directory.
- Never store planning documents in root folders or typo-prone folders like `plan/` or `plans/`.
- Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

### Documentation & Change Tracking
- **Post-Change Reporting:** After every code modification, you MUST provide a brief, clear explanation of the changes made.
- **Change Log Requirement**:
    - Create/Update a folder named `.dev_history` in the root directory.
    - Inside this folder, create a markdown file named `change_log.md`,
    - Persistence: If `change_log.md` already exists, you MUST load its existing content and append new changes to it, ensuring historical data is preserved.
    - Append behavior: For every session or modification, append the changes to change_log.md. If you prefer to group by date, check if an entry for the current date exists; if not, add a new date header, or simply append the new entry under the current date section.
    - Append a summary of the changes to this file, including:
        1. A high-level description of what was done.
        2. A bulleted list of files modified.
        3. A brief rationale for the changes.
- **Visibility:** Always display the summary of these changes in your final chat response immediately after completing the task.

### Workflow & Branching Policy
- **Branch-First Development:** Before making any code changes, creating new features, or implementing bug fixes, you MUST verify the current branch.
- **Requirement:** If not already on a dedicated feature or fix branch, you must suggest or create a new, appropriately named branch (e.g., `feature/description` or `fix/issue-name`) using `git checkout -b <branch-name>`.
- **Constraint:** Do not apply code changes directly to `main`, `master`, `staging`, `development`, or `pre-develoment` branches.
- **Workflow:** 1. Assess the task.
    2. Check the current git branch.
    3. If necessary, execute the git command to switch to a new branch.
    4. Proceed with code implementation only after the branch is confirmed.