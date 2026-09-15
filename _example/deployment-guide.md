# Deployment Guide: Docker & Orchestration

This document outlines how to containerize and deploy the MyChange Backend using Docker and Docker Compose.

## Architecture Overview

The application is split into two primary runtime processes sharing the same codebase and dependencies:
1.  **API Service**: Handles HTTP requests, manages user interactions, and triggers background jobs.
2.  **Worker Service**: Processes long-running tasks, handles webhooks asynchronously, and executes cron jobs.

## 1. Docker Configuration

### .dockerignore
To keep images slim and secure, the following are excluded from the build context:
- `node_modules` and `dist`
- `.env*` (Environment secrets)
- `.git` and `.dev_history`
- Log files

### Dockerfile
The project uses a **multi-stage build** to optimize image size:
- **Base Stage**: Sets up Node.js 22 and enables `corepack` for `pnpm`.
- **Deps Stage**: Installs all dependencies (including devDependencies for the build).
- **Build Stage**: Runs `pnpm run build`, which executes `prisma generate` (to create the client) and `tsc` (to compile TypeScript to JavaScript).
- **Prod Stage**: A slim image containing only production dependencies and the compiled `dist` folder.

## 2. Orchestration with Docker Compose

The `compose.yaml` file orchestrates four critical components: `postgres`, `redis`, `api`, and `worker`.

### Configuration File (`compose.yaml`)
```yaml
services:
  # ---------------------------------------------------------------------------
  # Database: PostgreSQL
  # ---------------------------------------------------------------------------
  postgres:
    image: postgres:16-alpine
    container_name: mychange-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
      POSTGRES_DB: ${DB_NAME:-mychange_db}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-mychange_db}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ---------------------------------------------------------------------------
  # Cache & Queue: Redis
  # ---------------------------------------------------------------------------
  redis:
    image: redis:7-alpine
    container_name: mychange-redis
    restart: always
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ---------------------------------------------------------------------------
  # Main Application API
  # ---------------------------------------------------------------------------
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: mychange-api
    restart: always
    ports:
      - "6001:6001"
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-password}@postgres:5432/${DB_NAME:-mychange_db}?schema=public
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ---------------------------------------------------------------------------
  # Background Worker
  # ---------------------------------------------------------------------------
  worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: mychange-worker
    restart: always
    command: node dist/worker.js
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-password}@postgres:5432/${DB_NAME:-mychange_db}?schema=public
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
```

### Service Definitions
- **PostgreSQL**: The primary data store. Includes a healthcheck using `pg_isready`.
- **Redis**: Used for BullMQ queue management and SSE Pub/Sub. Includes a healthcheck using `redis-cli ping`.
- **API**: The main entry point. Depends on `postgres` and `redis` being healthy.
- **Worker**: The background processor. Uses the same image as the API but overrides the startup command to `node dist/worker.js`.

### Network Connectivity
Within the Docker network, services communicate via their service names:
- **Database**: `postgresql://user:pass@postgres:5432/db`
- **Redis**: `redis:6379`

## 3. Deployment Workflow

### Step 1: Environment Setup
Create a `.env` file in the root directory with the necessary credentials:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=mychange_db
JWT_TOKEN_SECRET=your_secret
```

### Step 2: Launch the Stack
Build the images and start the services in detached mode:
```sh
docker compose up -d --build
```

### Step 3: Database Migration
Since the app expects the schema to be up-to-date, run the Prisma migration command against the running container:
```sh
docker compose exec api npx prisma migrate deploy
```

### Step 4: Verification
Verify the logs to ensure both API and Worker are running:
```sh
docker compose logs -f api
docker compose logs -f worker
```

## 4. Summary Table

| Service | Image | Port | Entry Point | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `api` | Custom | 6001 | `dist/index.js` | REST API & Orchestration |
| `worker` | Custom | N/A | `dist/worker.js` | Async Tasks & Cron |
| `postgres`| `postgres:16-alpine` | 5432 | N/A | Persistent Data |
| `redis` | `redis:7-alpine` | 6379 | N/A | Queue & Real-time state |
