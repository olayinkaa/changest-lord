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

The `compose.yaml` file orchestrates the essential runtime components: `redis`, `api`, and `worker`. Since the database is hosted externally via Neon, it is not managed within the local compose stack.

### Configuration File (`compose.yaml`)
```yaml
services:
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
      - REDIS_HOST=redis
    depends_on:
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
      - REDIS_HOST=redis
    depends_on:
      redis:
        condition: service_healthy
```

### Service Definitions
- **Redis**: Used for BullMQ queue management and SSE Pub/Sub. Includes a healthcheck using `redis-cli ping`.
- **API**: The main entry point. Depends on `redis` being healthy.
- **Worker**: The background processor. Uses the same image as the API but overrides the startup command to `node dist/worker.js`.

### Network Connectivity
Within the Docker network, services communicate via their service names:
- **Redis**: `redis:6379`
- **Database**: Provided via the `DATABASE_URL` in the `.env` file (External Neon instance).

## 3. Deployment Workflow

### Step 1: Environment Setup
Create a `.env` file in the root directory. Ensure the `DATABASE_URL` points to your Neon instance:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-odd-bonus...neon.tech/neondb?sslmode=require"
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
| `postgres`| Neon (External) | 5432 | N/A | Persistent Data |
| `redis` | `redis:7-alpine` | 6379 | N/A | Queue & Real-time state |
