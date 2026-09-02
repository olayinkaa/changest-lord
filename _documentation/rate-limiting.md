# API Rate Limiting Architecture

This document describes the implementation and rationale for the API rate limiting system used in the MyChange Backend.

## Overview

The system implements rate limiting to protect the API from abuse, prevent brute-force attacks (especially on authentication endpoints), and ensure fair resource distribution among users.

## Technical Implementation

### 1. Infrastructure: Redis Store
The rate limiter uses `express-rate-limit` with a `rate-limit-redis` store. 

**Why Redis?**
- **Distributed State:** In a multi-server environment, local memory counters would be isolated to each server. Redis provides a shared global state, ensuring a user's limit is enforced across all application instances.
- **Performance:** Being an in-memory store, Redis provides sub-millisecond latency, preventing the rate-limit check from becoming a bottleneck.
- **Automatic TTL:** Redis's Time-To-Live (TTL) feature automatically expires counters after the time window closes, eliminating the need for manual cleanup jobs.

**Compatibility Bridge:**
Since the project uses a specific Redis client wrapper, a `sendCommand` bridge is implemented to map the library's generic commands to the `redisClient.call()` method.

### 2. Proxy Trust (`trust proxy`)
The application is configured with `app.set("trust proxy", 1)`.

**Why this is critical:**
When the app is deployed behind a load balancer or proxy (Nginx, AWS ALB, Cloudflare), the incoming request's IP appears as the proxy's IP. Without `trust proxy`, the rate limiter would treat all traffic as coming from a single source, meaning one malicious user could trigger a rate limit that blocks **all** legitimate users. Setting this allows Express to read the `X-Forwarded-For` header to identify the real client IP.

### 3. Limiting Strategies

The system implements two distinct strategies based on the authentication state of the request:

#### A. IP-Based Limiting (`loginRateLimit`)
Used for public endpoints (e.g., `/login`, `/register`).
- **Key:** The client's IP address.
- **Purpose:** Prevents brute-force attacks on credentials.
- **Logic:** Each unique IP is tracked independently in Redis.

#### B. User-ID Based Limiting (`userRateLimit`)
Used for protected endpoints (e.g., `/transfer`, `/profile`).
- **Key:** Prioritizes `userId` (from the JWT/Auth context), falling back to IP address.
- **Purpose:** Prevents a single authenticated user from over-utilizing the system, regardless of their IP address (e.g., preventing a user from switching IPs to bypass limits).
- **Logic:** The `keyGenerator` extracts the user ID from the request object to create a unique Redis key per account.

## Configuration Summary

| Limiter | Target | Key Source | Default Limit | Window |
| :--- | :--- | :--- | :--- | :--- |
| `loginRateLimit` | Public / Auth | IP Address | 5 requests | 15 minutes |
| `userRateLimit` | Protected API | User ID $\rightarrow$ IP | 100 requests | 1 minute |
