# Queue Architecture Specification

This document explains the structural relationship between the Core, Adapters, and Modules in the background processing system.

## 1. The Three-Layer Hierarchy

The system is split into three layers to separate **Infrastructure**, **Framework**, and **Business Logic**.

### Layer 1: The Adapter (`src/adapters/bullmq`)
**Role: The "Muscle" (Infrastructure)**
This layer is a thin wrapper around the third-party `bullmq` library. It doesn't know *what* is being queued; it only knows *how* to talk to Redis.
- **`queue.service.ts`**: A generic utility to create BullMQ `Queue` instances and add raw data to them.
- **`worker.service.ts`**: A utility to instantiate BullMQ `Worker` processes.

### Layer 2: The Core (`src/core/queue`)
**Role: The "Brain" (Framework)**
This layer defines the **rules** of the system. It provides the type safety and the base classes that all features must follow.
- **`queue.types.ts`**: The most important file. It contains the `QueuePayloadMap`, which maps specific queue names (e.g., `"email"`) to their required data shapes (e.g., `EmailJobPayload`).
- **`queue.service.ts`**: The **Typed Wrapper**. It uses the `QueuePayloadMap` to ensure that you cannot send a "Payment" payload to an "Email" queue.
- **`base.processor.ts`**: An abstract class that provides standard logging and error handling for all background workers.

### Layer 3: The Module (`src/modules/email`)
**Role: The "Feature" (Business Logic)**
This is where the actual product work happens.
- **`email.producer.ts`**: Uses the Core `QueueService` to trigger an email job.
- **`email.processor.ts`**: Extends the Core `BaseProcessor` to define exactly what happens when an email job is picked up (e.g., calling the SES adapter).

---

## 2. Why are there two `queue.service.ts`?

It can look like duplication, but they serve different purposes:

| Feature | Adapter Queue Service | Core Queue Service |
| :--- | :--- | :--- |
| **Location** | `src/adapters/bullmq/` | `src/core/queue/` |
| **Purpose** | Low-level BullMQ wrapper | High-level Typed Orchestrator |
| **Typing** | Generic (`any` / `T`) | Strict (`QueuePayloadMap[K]`) |
| **Awareness** | Knows BullMQ $\rightarrow$ Redis | Knows Business Rules $\rightarrow$ Types |
| **Responsibility** | "Put this data in Redis" | "Ensure this data is valid for this queue" |

---

## 3. The Data Flow (End-to-End)

### Flow A: Producing a Job (The Trigger)
`EmailProducer` (Module) $\rightarrow$ `QueueService` (Core) $\rightarrow$ `BullMQQueueService` (Adapter) $\rightarrow$ **Redis**

### Flow B: Consuming a Job (The Execution)
**Redis** $\rightarrow$ `WorkerBootstrap` (Core) $\rightarrow$ `EmailProcessor` (Module) $\rightarrow$ `SesEmailSender` (Adapter)
