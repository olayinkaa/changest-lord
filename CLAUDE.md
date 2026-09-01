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
- **Infrastructure**: Redis, BullMQ (async task processing)
- **Documentation**: OpenAPI 3.0 (`openapi.yaml`), swagger-ui-express
- **Other**: helmet, cors, multer, cloudinary, axios, aws-sdk (@aws-sdk/client-sesv2, @aws-sdk/client-rekognition)
- **Linter/Formatter**: Biome 2.5.5 (tabs, double quotes, semicolons as needed)

## Common Commands

All commands run from the repo root. The Makefile wraps the most common ones.

### Development
```sh
pnpm run dev:local       # watch mode with .env.local (API only)
pnpm run dev:staging     # watch mode with .env.staging (API only)
pnpm run worker:dev:local # watch mode with .env.local (Worker only)
pnpm run dev:all         # concurrently run API and Worker in dev mode
make dev                 # alias for pnpm run dev (uses .env)
make secret              # generate a JWT secret: openssl rand -base64 32
```

### Build & Run
```sh
pnpm run build           # prisma generate + tsc + tsc-alias → dist/
pnpm run start           # node dist/index.js (API)
pnpm run worker:start    # node dist/worker.js (Worker)
pnpm run dev:clean       # rm -rf dist
```

### Lint / Format / Docs
```sh
pnpm run lint:check:fix  # biome check --write ./src (also runs via husky pre-commit on staged files)
pnpm run docs:check      # verify OpenAPI spec consistency via scripts/docs-check.ts
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

The Prisma schema entrypoint is `prisma/schema.prisma`, which should compose models from `prisma/models/*.prisma` (e.g., `user.prisma`, `enum.prisma`). Generated client lives at `src/generated/prisma`.

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
3. `App.configureService` loads all `AppModules` from `src/app.module.ts` into the container.
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
- `<name>.types.ts` — `Symbol.for(...)` DI tokens used in `@inject(TYPES.X)` and service/repository interfaces.
- `<name>.interfaces.ts` (optional) — additional contracts split out from `types.ts` when the file grows.

Wired domains: `user/`, `auth/`, `address/`, `business-type/`, `liveness/`, `kyc/`, `bvn/`, `nin/`, `onboarding/`, `file/`.

### Asynchronous Processing (Queue/Worker)
The system uses a separate worker process for long-running or background tasks:
- **Entry point**: `src/worker.ts` initializes a separate Inversify container and starts BullMQ workers.
- **Core Queue Logic**: `src/core/queue` provides base queue classes and types.
- **Adapters**: `src/adapters/bullmq` and `src/adapters/redis` implement the queue backend.
- **Job Handlers**: Located in `src/modules/workers/`, these contain the business logic for specific background jobs.

### Cross-cutting concerns
- **DI tokens**: `src/types/di-types.ts` holds global `TYPES` (currently just `Logger`). Per-module tokens go in `<module>.types.ts`. Adapter-layer tokens are unified in `src/adapters/adapters.types.ts` (`ADAPTER_TYPES`).
- **Logger**: `src/config/pino-logger.ts` exports `pinoLogger` (singleton) and a `LoggerModule` that binds `TYPES.Logger` to a request-scoped child logger. Inject as `private logger: pino.Logger` in controllers.
- **Validation**: `validateSchema(DtoClass)` (`src/core/middleware/validate-schema.ts`) is applied as `withMiddleware(...)` to controller methods.
- **Errors**: throw `HttpException` subclasses from `src/core/errors/exceptions.ts`. Global handler in `error-handler.ts` serializes them as `{ code, status: "error", message, data? }`.
- **API responses**: standardize on `ApiResponse<T>` from `src/utils/http-response.ts`.
- **API Documentation**: `src/docs/openapi.yaml` is the source of truth. Served via Swagger UI (`src/config/swagger.ts`).

### Adapter modules (`src/adapters/`)
Wired via `AdaptersModule` (see `src/adapters/adapters.module.ts`) and exported from `src/app.module.ts`.
- `anchor-api-sdk/` — Anchor API client (banks, virtual accounts, transfers, airtime, data).
- `cloudinary/` — image upload service + interface.
- `google/` — Google Maps Places autocomplete.
- `aws-rekognition/` — AWS Rekognition wrapper for face comparison.
- `aws-ses/` — AWS SES for transactional emails.
- `redis/` & `bullmq/` — Redis client and BullMQ queue implementation.
- `payment/` & `verification/` — Wrappers for payment and identity verification providers.

## Code Conventions

- Biome enforces tabs, double quotes, 90-char line width, no semicolons where optional. Organize imports is on.
- Controllers are thin; put business logic in `*.service.ts`.
- Always throw `HttpException` subclasses (not raw `Error`) so the error handler renders them correctly.
- New domain code goes in `src/modules/<name>/` with the standard files; bind via a `ContainerModule` and add it to `src/app.module.ts`.
- Per-module DI tokens and interfaces live in `*.types.ts`.
- Use `validateSchema(DtoClass)` decorator on any controller method that accepts a body.
- Wrap response payloads in `ApiResponse.success(...)` from `src/utils/http-response.ts`.
- For Prisma schema additions, add a new file under `prisma/models/` and ensure it's referenced from `prisma/schema.prisma`.
- Logs: `pinoLogger` already redacts `req.headers.authorization`, `password`, and `pin`.

## API Surface

Base path: `/api/v1`. Example: `UserController` mounts at `/api/v1/users`.
Currently exposed slices: `users`, `auth`, `address`, `business-type`, `liveness`, `kyc`, `bvn`, `nin`, `onboarding`.

## Current State (snapshot)

- **Working**: bootstrap, DI container, Prisma connection, request logger, error handler, CORS, validation, `ApiResponse` envelope, BullMQ/Redis integration, Swagger documentation, most domain controllers/services.
- **Stubs / to be implemented**: Prisma schema is not yet composed (per-model files exist in `prisma/models/` but `schema.prisma` doesn't reference them); some repository layers for newer modules might be skeleton files.

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
- **Workflow:** 
    1. Assess the task.
    2. Check the current git branch.
    3. If necessary, execute the git command to switch to a new branch.
    4. Proceed with code implementation only after the branch is confirmed.
