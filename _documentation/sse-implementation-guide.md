# Server-Sent Events (SSE) Implementation Guide

## Overview
The SSE implementation provides a scalable way to push real-time notifications to clients. Instead of the client polling the server for updates, the server maintains an open HTTP connection and pushes events as they happen.

## Architecture
The system uses a **Redis Pub/Sub** backbone to ensure that notifications work across a clustered environment (multiple server instances).

**Flow:**
`Trigger (Worker/Service)` $\rightarrow$ `SseService.emitEvent()` $\rightarrow$ `Redis Publish` $\rightarrow$ `Redis Subscribe (on current node)` $\rightarrow$ `SseSession.push()` $\rightarrow$ `Client Browser`

## Technical Components

### 1. SseService (`src/modules/sse/sse.service.ts`)
- **Session Tracking**: Manages a `Map<string, Session[]>` to handle multiple open tabs/devices per user.
- **Redis Subscription**: Every connection creates a subscription to `user:events:${userId}`.
- **`better-sse`**: Handles the complex parts of the SSE spec, including:
    - Sending the correct HTTP headers.
    - Managing keep-alive "heartbeats" to prevent proxy timeouts.
    - Handling connection closures.

### 2. SseController (`src/modules/sse/sse.controller.ts`)
- Exposes the endpoint: `GET /api/v1/sse/events`.
- **Security**: Protected by `AuthGuard`. The `userId` is extracted from the JWT token to ensure users only receive their own notifications.

### 3. Redis Adapter (`src/adapters/redis/redis.service.ts`)
- Implements separate `pubClient` and `subClient`. This is critical because `ioredis` prevents a client in "subscriber" mode from performing other commands (like `GET` or `SET`).

## API Usage

### Emitting an Event
To send a notification to a user from anywhere in the backend:

```typescript
import { inject, injectable } from "inversify";
import { SSE_TYPES } from "@/modules/sse/sse.types";
import type { ISseService } from "@/modules/sse/sse.types";

@injectable()
export class MyService {
    constructor(@inject(SSE_TYPES.Service) private sseService: ISseService) {}

    async doSomething(userId: string) {
        // ... business logic ...
        
        await this.sseService.emitEvent(userId, "EVENT_NAME", { 
            key: "value" 
        });
    }
}
```

### Client-Side Consumption
The client uses the native browser `EventSource` API:

```javascript
const eventSource = new EventSource('/api/v1/sse/events', {
    headers: { 'Authorization': 'Bearer <token>' } // Note: Standard EventSource doesn't support headers; 
                                                    // a polyfill or query param is usually required.
});

eventSource.addEventListener('EVENT_NAME', (event) => {
    const data = JSON.parse(event.data);
    console.log("Received notification:", data);
});
```

## Scalability & Performance
- **Memory**: Sessions are stored in a Map; cleanup is handled on the `close` event.
- **Network**: Redis Pub/Sub is extremely lightweight, making this approach suitable for thousands of concurrent connections.
- **Reliability**: The `better-sse` heartbeat mechanism ensures that load balancers (like Nginx or AWS ALB) do not kill the connection due to inactivity.
