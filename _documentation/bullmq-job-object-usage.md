# BullMQ Job Object Usage Guide

This guide explains how to use the `job` parameter within the `handle` method of a `BaseProcessor`. While simple tasks (like sending a single email) only need the `data` payload, the `job` object provides critical metadata and control mechanisms for complex background tasks.

## 1. The `job` Object Anatomy

When a processor handles a job, the `job` object contains:
- `job.id`: Unique identifier for the job.
- `job.data`: The payload sent by the producer (already passed as the first argument to `handle`).
- `job.attemptsMade`: How many times this job has been tried.
- `job.timestamp`: When the job was created.
- `job.processedOn`: Which worker process handled the job.

---

## 2. Practical Usage Scenarios

### Scenario A: Advanced Logging and Traceability
Instead of generic logs, use the `job.id` to trace a specific request across your system.

```typescript
protected async handle(data: MyPayload, job: Job<MyPayload>): Promise<void> {
  pinoLogger.info({ jobId: job.id, userId: data.userId }, "Starting heavy report generation");
  
  try {
    await this.generateReport(data);
  } catch (err) {
    pinoLogger.error({ jobId: job.id, err }, "Report generation failed");
    throw err; // Throwing allows BullMQ to handle the retry based on options
  }
}
```

### Scenario B: Dynamic Retry Logic
You can change the behavior of a job based on how many times it has already failed.

```typescript
protected async handle(data: MyPayload, job: Job<MyPayload>): Promise<void> {
  if (job.attemptsMade > 2) {
    // On the 3rd failure, notify the admin instead of just retrying again
    await this.notificationService.alertAdmin(`Job ${job.id} failing repeatedly`);
  }
  
  await this.processPayment(data);
}
```

### Scenario C: Progress Tracking
For long-running jobs (e.g., processing a large CSV file), you can report progress back to Redis, which can then be read by a frontend API to show a progress bar.

```typescript
protected async handle(data: MyPayload, job: Job<MyPayload>): Promise<void> {
  const items = data.items;
  for (let i = 0; i < items.length; i++) {
    await this.processItem(items[i]);
    
    // Update progress (0 to 100)
    const percent = Math.round((i / items.length) * 100);
    await job.progress(percent);
  }
}
```

### Scenario D: Idempotency Checks
Use the `job.id` to ensure you don't process the same transaction twice if a worker crashes and restarts.

```typescript
protected async handle(data: MyPayload, job: Job<MyPayload>): Promise<void> {
  const isProcessed = await this.db.transactionLog.findUnique({ 
    where: { jobId: job.id } 
  });

  if (isProcessed) {
    pinoLogger.warn({ jobId: job.id }, "Job already processed, skipping");
    return;
  }

  await this.executeTransaction(data);
  await this.db.transactionLog.create({ data: { jobId: job.id } });
}
```

---

## 3. Summary Table

| Feature | Method/Property | Use Case |
| :--- | :--- | :--- |
| **Identification** | `job.id` | Correlating logs, database idempotency checks. |
| **Resilience** | `job.attemptsMade` | Escalating failures to admins after $N$ tries. |
| **Feedback** | `job.progress(n)` | Powering UI progress bars for long tasks. |
| **Metadata** | `job.timestamp` | Measuring "queue lag" (time from creation to execution). |
