# Queue Usage Guide: Core vs Adapter

This guide explains when to use the **Core Queue Service** and the **BullMQ Adapter**, providing concrete code examples for each scenario.

## 1. The Rule of Thumb

| If you are... | Use this Service | Why? |
| :--- | :--- | :--- |
| **Writing a Feature/Module** (e.g., Email, KYC, Payments) | `QueueService` (Core) | You get full type safety. TypeScript will prevent you from sending the wrong data to the wrong queue. |
| **Building Infrastructure** (e.g., a generic job wrapper, a custom monitor) | `BullMQQueueService` (Adapter) | You need raw access to the underlying BullMQ library and don't care about specific business payloads. |

---

## 2. Using the Core Queue Service (Recommended)

Use this for 99% of your application logic. It ensures that your jobs follow the `QueuePayloadMap` defined in `src/core/queue/queue.types.ts`.

### Example: Sending an Email Job
```typescript
import { injectable, inject } from "inversify";
import { TYPES } from "@/core/queue/queue.types";
import type { IQueueService } from "@/core/queue/queue.types";

@injectable()
export class WelcomeEmailProducer {
  constructor(
    @inject(TYPES.QueueService) private readonly queueService: IQueueService
  ) {}

  async sendWelcome(user: any) {
    // ✅ TYPE SAFE: 
    // TypeScript knows that "email" queue requires an EmailJobPayload.
    // If you pass wrong data here, it will show a red underline.
    await this.queueService.publish("email", {
      to: user.email,
      subject: "Welcome to MyChange!",
      htmlBody: `<h1>Hello ${user.firstName}</h1>`,
      fromEmail: "no-reply@mychange.app"
    }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 }
    });
  }
}
```

---

## 3. Using the BullMQ Adapter (Infrastructure)

Use this when you need a raw BullMQ `Queue` object to access advanced features not exposed by the Core service (like `pause()`, `resume()`, or complex job management).

### Example: A Queue Management Dashboard
```typescript
import { injectable, inject } from "inversify";
import { BULLMQ_TYPES } from "@/adapters/bullmq/types";
import type { IBullMQQueueService } from "@/adapters/bullmq/types";

@injectable()
export class QueueAdminService {
  constructor(
    @inject(BULLMQ_TYPES.QueueService) private readonly bullmq: IBullMQQueueService
  ) {}

  async pauseEmailQueue() {
    // getQueue returns the raw BullMQ Queue object
    const queue = this.bullmq.getQueue("email");
    await queue.pause();
    console.log("Email queue paused for maintenance.");
  }

  async resumeEmailQueue() {
    const queue = this.bullmq.getQueue("email");
    await queue.resume();
    console.log("Email queue resumed.");
  }
}
```

---

## 4. Comparison Summary

### Core `QueueService` (The Guard)
- **Interface**: `IQueueService`
- **Token**: `TYPES.QueueService`
- **Main Method**: `.publish(name, data, options)`
- **Strength**: Prevents bugs by enforcing that `Queue A` only receives `Payload A`.

### Adapter `BullMQQueueService` (The Tool)
- **Interface**: `IBullMQQueueService`
- **Token**: `BULLMQ_TYPES.QueueService`
- **Main Method**: `.getQueue(name)`
- **Strength**: Provides raw access to the underlying engine for infrastructure tasks.

## 5. Implementation Flow

**Call Stack**:
`Feature Module` $\rightarrow$ `Core QueueService` $\rightarrow$ `BullMQ Adapter` $\rightarrow$ `BullMQ Library` $\rightarrow$ `Redis`
