# Redis and BullMQ Implementation Specification

This document outlines the implementation and usage of the Redis caching and BullMQ background processing system in the MyChange Backend.

## 1. Architecture Overview

The system uses a distributed architecture where the API and Workers communicate via a Redis instance.

- **API Process**: Produces jobs (pushes to Redis).
- **Worker Process**: Consumes jobs (pulls from Redis and executes).
- **Redis**: Acts as the message broker (BullMQ) and the distributed cache (ioredis).

---

## 2. Redis Cache Usage (`IRedisService`)

The `RedisService` provides a high-performance wrapper around `ioredis` for caching and data structure management.

### Basic Operations
```typescript
// Inject IRedisService via REDIS_TYPES.Service
constructor(@inject(REDIS_TYPES.Service) private readonly redis: IRedisService) {}

// Set a value with TTL (Default 3600s)
await this.redis.set("user:session:123", { active: true }, { ttlSeconds: 600 });

// Get a value
const session = await this.redis.get<{ active: boolean }>("user:session:123");

// Delete a key or multiple keys
await this.redis.del("user:session:123");
await this.redis.del(["key1", "key2"]);

// Invalidate all keys with a specific prefix
await this.redis.invalidateCache("user:session");
```

### Smart Caching Pattern (`fetchWithCache`)
This is the recommended way to handle database queries that don't change often.

```typescript
const userData = await this.redis.fetchWithCache({
  key: `user:profile:${userId}`,
  ttlSeconds: 3600,
  fetcher: async () => {
    // This block only runs if the key is missing or expired in Redis
    return await this.userRepository.findUser(userId);
  },
});
```

---

## 3. BullMQ Background Tasks

### Producing Jobs (`IBullMQQueueService`)
Use the `BullMQQueueService` to offload heavy tasks.

```typescript
// Inject IBullMQQueueService via BULLMQ_TYPES.QueueService
constructor(@inject(BULLMQ_TYPES.QueueService) private readonly queue: IBullMQQueueService) {}

async triggerEmail() {
  await this.queue.addJob(
    "email-queue",      // Queue name
    "send-welcome",     // Job name (used by processor to identify task)
    { email: "user@example.com", name: "John" }, // Job data
    { 
      attempts: 3, 
      backoff: { type: 'exponential', delay: 1000 } 
    } // Options
  );
}
```

### Consuming Jobs (`BullMQWorkerService`)
Workers are registered during the bootstrap phase of the `src/worker.ts` process.

```typescript
// Inside a bootstrap or manager class
constructor(@inject(BullMQWorkerService) private readonly workerManager: BullMQWorkerService) {}

async init() {
  await this.workerManager.registerWorker({
    name: "email-queue",
    processor: async (job) => {
      const { email, name } = job.data;
      console.log(`Sending welcome email to ${name} at ${email}...`);
      // Implementation logic here
      return { status: "sent" };
    }
  });
}
```

---

## 4. Operational Guide

### Running the Environment
To run the full system locally, you need two terminal windows:

**Terminal 1 (API):**
`pnpm run dev`

**Terminal 2 (Worker):**
`pnpm run worker:dev`

### Monitoring
- **Redis**: Use `redis-cli monitor` to see jobs being pushed and popped in real-time.
- **Logs**: The worker process will log `Job <id> completed` or `Job <id> failed` for every task.
