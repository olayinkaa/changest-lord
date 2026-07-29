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
make dev                 # alias for dev:local
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
pnpm run lint:check:fix  # biome check --write on src/
```

### Database (Prisma)
```sh
make migrate             # interactive: prompts for migration name, then prisma migrate dev --name <name>
make rm-migration        # rm -rf prisma/migrations
make drop-db             # prisma migrate reset --force
pnpm exec prisma generate   # regenerate client (output: src/generated/prisma)
```

The Prisma schema entrypoint is `prisma/schema.prisma` which composes models from `prisma/models/*.prisma` (e.g. `user.prisma`, `enum.prisma`). Generated client lives at `src/generated/prisma` — it is committed-friendly code but should be regenerated after schema changes.

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
3. `App.configureService` loads all `AppModules` (currently `UserModule`, `LoggerModule`) into the container.
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
- `<name>.tokens.ts` — `Symbol.for(...)` identifiers used in `@inject(TYPES.X)`.
- `<name>.contracts.ts` — interfaces (currently empty for `user`; define them here when adding business logic).

`UserModule` is wired but its service / repository are empty stubs — the controller currently returns mock data without DB access. The wiring skeleton is in place to fill in real logic.

### Cross-cutting concerns
- **DI tokens**: `src/types/di-types.ts` holds global `TYPES` (currently just `Logger`). Per-module tokens go in `<module>.tokens.ts`.
- **Logger**: `src/config/pino-logger.ts` exports `pinoLogger` (singleton) and a `LoggerModule` that binds `TYPES.Logger` to a request-scoped child logger (each request gets a `requestId`). Inject as `private logger: pino.Logger` in controllers. The `logService` decorator (`src/common/injectable/service.ts`) is provided for use on services/properties.
- **Validation**: `validateSchema(DtoClass)` (`src/core/middleware/validate-schema.ts`) is applied as `withMiddleware(...)` to controller methods. It uses `class-transformer` + `class-validator` with `whitelist` + `forbidNonWhitelisted`. The validated DTO instance replaces `req.body`.
- **Errors**: throw `HttpException` subclasses from `src/core/errors/exceptions.ts` (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`). The global handler in `error-handler.ts` serializes them as `{ code, status: "error", message, data? }`. Unknown errors become 500.
- **CORS**: `src/config/cors.ts` whitelists localhost ports 3000/5005/5173/4006 with credentials.
- **Prisma client**: `src/core/database/db.ts` exports a shared `prisma` instance (driver-adapter for Postgres) that hot-reloads in dev via `globalThis`.

### Infrastructure modules (`src/infrastructure/`)
- `anchor-api-sdk/` — contract for the Anchor API (banks, virtual accounts, transfers, airtime, data) with TypeScript ambient interfaces in `src/types/global.d.ts` (`AnchorBank`, `AnchorVirtualAccount`, etc.).
- `cloudinary/` — service + contract for image upload.

These are not yet wired into `AppModules`.

### Path alias
`@/*` maps to `./src/*` (see `tsconfig.json`). Use it for cross-folder imports, e.g. `import { config } from "@/config/env"`.

## Code Conventions

- Biome enforces tabs, double quotes, 90-char line width, no semicolons where optional. Organize imports is on.
- Controllers are thin; put business logic in `*.service.ts`.
- Always throw `HttpException` subclasses (not raw `Error`) so the error handler renders them correctly.
- New domain code goes in `src/modules/<name>/` with the standard files; bind via a `ContainerModule` and add it to `src/app.module.ts`.
- For each module, populate `*.tokens.ts` for DI identifiers and `*.contracts.ts` for service/repository interfaces; bind in the module's `*.module.ts`.
- Use `validateSchema(DtoClass)` decorator on any controller method that accepts a body.
- For Prisma schema additions, add a new file under `prisma/models/` and ensure it's referenced from `prisma/schema.prisma` (currently the schema is minimal — only `datasource db` and `generator client` — so new models need to be wired in).
- Logs: `pinoLogger` already redacts `req.headers.authorization`, `password`, and `pin` — keep secrets out of other log fields.

## API Surface

Base path: `/api/v1`. Example: `UserController` mounts at `/api/v1/users` (from `@controller("/users")` + `rootPath: "/api/v1"`).

## Current State (snapshot)

- Working: bootstrap, DI container, Prisma connection, request logger, error handler, CORS, validation, `UserController` GET/POST (mock data).
- Stubs / to be implemented: `user.service.ts`, `user.repository.ts`, `user.contracts.ts`, `auth/*`, `address/*`, `Anchor` SDK wiring, `Cloudinary` wiring, full Prisma schema.
- Swagger URL is referenced in the README but not yet wired in code.

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