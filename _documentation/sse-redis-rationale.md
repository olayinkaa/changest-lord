# Why Redis is used for SSE (Architecture Decision Record)

## The Problem: Memory Isolation
In a Node.js application, a Server-Sent Events (SSE) connection is a physical TCP socket held in the **RAM (memory)** of a specific server instance.

If the application is scaled horizontally (running multiple instances behind a Load Balancer), the following "split-brain" scenario occurs:
1. **User A** connects to **Server 1**. Server 1 now holds the active connection to User A.
2. A background task (e.g., a BullMQ Worker) completes on **Server 2**.
3. **Server 2** attempts to notify User A, but it cannot find the connection in its own memory.

Without a shared communication layer, the notification is lost because Server 2 has no way to tell Server 1 to push data to its connected client.

## The Solution: Redis Pub/Sub
Redis Pub/Sub acts as a global message broker (an "intercom system") that synchronizes all server instances.

### How it works:
- **Subscription**: When a user connects to any server instance, that instance subscribes to a Redis channel specific to that user: `user:events:${userId}`.
- **Publishing**: When any part of the system (any server or any worker) needs to notify a user, it publishes a message to that specific Redis channel.
- **Delivery**: Redis broadcasts the message to all subscribed instances. The instance that currently holds the active SSE connection for that user receives the message and pushes it to the client.

## Comparison: Local vs. Distributed SSE

| Feature | Local EventEmitter (No Redis) | Redis Pub/Sub (Implemented) |
| :--- | :--- | :--- |
| **Single Server** | Works | Works |
| **Multi-Server Cluster** | **Broken** (Notifications only sent if worker and user are on same node) | **Works** (Events are routed to the correct node) |
| **Separate Worker Process** | **Broken** (Workers cannot access API memory) | **Works** (Workers publish to Redis) |
| **Scalability** | Vertical only (Bigger server) | Horizontal (Add more servers) |

## Implications of removing Redis
Removing Redis would force the application to rely on a single process for both the API and the Workers, and would prevent the use of a Load Balancer with multiple instances. This would create a single point of failure and severely limit the application's ability to handle high traffic.
