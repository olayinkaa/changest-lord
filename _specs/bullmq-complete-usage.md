# BullMQ Full-Cycle Implementation Examples

This document provides complete, end-to-end examples of how to implement background tasks using the integrated BullMQ system. It covers both the **Producer** (who triggers the task) and the **Processor** (who executes the task).

## 1. Example: Email Delivery System

### Step A: Define the Type (`src/core/queue/payloads.ts`)
```typescript
export type EmailJobPayload = {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  fromEmail?: string;
};
```

### Step B: The Producer (`src/modules/email/email.producer.ts`)
The producer handles the request from the API and puts the job in the queue.

```typescript
@injectable()
export class EmailProducer implements IEmailProducer {
  constructor(@inject(TYPES.QueueService) private readonly queue: IQueueService) {}

  async sendTransactionalEmail(user: User) {
    // Push to 'email' queue with strong typing
    return await this.queue.publish("email", {
      to: user.email,
      subject: "Welcome to MyChange!",
      htmlBody: "<h1>Welcome!</h1>",
      fromEmail: "no-reply@mychange.app",
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });
  }
}
```

### Step C: The Processor (`src/modules/workers/email/email.processor.ts`)
The processor runs in the `worker` process and executes the actual delivery.

```typescript
@injectable()
export class EmailProcessor extends BaseProcessor<typeof QUEUE_NAMES.Email> {
  public readonly queueName = QUEUE_NAMES.Email;
  protected readonly concurrency = 5;

  constructor(@inject(EMAIL_TYPES.EmailSender) private readonly sender: IEmailSender) {
    super();
  }

  protected async handle(data: EmailJobPayload, job: Job<EmailJobPayload>): Promise<void> {
    pinoLogger.info({ jobId: job.id, to: data.to }, "Sending email...");
    await this.sender.send(data);
  }
}
```

---

## 2. Example: Cloudinary Image Upload

### Step A: Define the Type (`src/core/queue/payloads.ts`)
```typescript
export type CloudinaryJobPayload = {
  fileUrl: string;
  folder: string;
  publicId?: string;
};
```

### Step B: The Producer (`src/modules/user/user.service.ts`)
Triggered when a user updates their profile picture.

```typescript
@injectable()
export class UserService {
  constructor(@inject(TYPES.QueueService) private readonly queue: IQueueService) {}

  async updateAvatar(userId: string, imageUrl: string) {
    // 1. Update DB status to 'uploading'
    await this.userRepo.updateAvatarStatus(userId, 'uploading');

    // 2. Enqueue the heavy upload task
    await this.queue.publish("cloudinary", {
      fileUrl: imageUrl,
      folder: `avatars/${userId}`
    });
  }
}
```

### Step C: The Processor (`src/modules/workers/cloudinary/cloudinary.processor.ts`)
Handles the network-heavy upload process.

```typescript
@injectable()
export class CloudinaryProcessor extends BaseProcessor<typeof QUEUE_NAMES.Cloudinary> {
  public readonly queueName = QUEUE_NAMES.Cloudinary;
  protected readonly concurrency = 2; // Low concurrency to avoid API rate limits

  constructor(@inject(ADAPTER_TYPES.CloudinaryService) private readonly cloudinary: ICloudinaryService) {
    super();
  }

  protected async handle(data: CloudinaryJobPayload, job: Job<CloudinaryJobPayload>): Promise<void> {
    try {
      const result = await this.cloudinary.upload(data.fileUrl, data.folder);
      // Update DB with the final Cloudinary URL
      await this.userRepo.updateAvatarUrl(data.publicId, result.url);
    } catch (err) {
      pinoLogger.error({ jobId: job.id, err }, "Cloudinary upload failed");
      throw err; // BullMQ will retry based on the producer's options
    }
  }
}
```

---

...
## 3. Quick Reference: Setup Checklist

When adding a new job, always follow this order:

1.  **Types**: Add to `QUEUE_NAMES` and `QueuePayloadMap` $\rightarrow$ `src/core/queue/payloads.ts`.
2.  **Processor**: Create a class extending `BaseProcessor` in `src/modules/workers/...`.
3.  **DI Binding**: Add `bind(MyProcessor).toSelf().tag(WORKER_PROCESSOR_TAG)` in `src/core/queue/worker.module.ts`.
4.  **Trigger**: Use `queueService.publish("queue-name", payload)` in your business logic.
5.  **Run**: Start both `pnpm run dev` (API) and `pnpm run worker:dev` (Worker).

---

## 4. The Worker Module Configuration (`src/core/queue/worker.module.ts`)

The `WorkerContainerModules` array is the "Registry" for your background process. For the workers to actually start, they must be bound and tagged.

```typescript
import { ContainerModule } from "inversify";
import { AdaptersModule } from "@/adapters/adapters.module";
import { EmailModule } from "@/modules/workers/email/email.module";
import { CloudinaryModule } from "@/modules/workers/cloudinary/cloudinary.module";
import { EmailProcessor } from "@/modules/workers/email/email.processor";
import { CloudinaryProcessor } from "@/modules/workers/cloudinary/cloudinary.processor";
import { WORKER_PROCESSOR_TAG } from "./worker.bootstrap";

const WorkerBindings = new ContainerModule((bind) => {
  // Register all processors with the WORKER_PROCESSOR_TAG
  bind(EmailProcessor).toSelf().tag(WORKER_PROCESSOR_TAG);
  bind(CloudinaryProcessor).toSelf().tag(WORKER_PROCESSOR_TAG);
});

export const WorkerContainerModules = [
  AdaptersModule,       // Provides Redis, SES, Cloudinary services
  EmailModule,           // Provides Email-specific dependencies
  CloudinaryModule,      // Provides Cloudinary-specific dependencies
  WorkerBindings,       // Provides the tagged processors
] as const;

export { WORKER_PROCESSOR_TAG };
```


## APPLICATION USAGE

```ts
import { inject, injectable } from "inversify";
import { EMAIL_TYPES, type IEmailProducer } from "@/modules/workers/email/email.types";
import type { IUserRepository } from "./user.repository.types";
import type { RegisterUserDto, User } from "./user.types";

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository,
    // 1. Inject the email producer via its Inversify symbol
    @inject(EMAIL_TYPES.Producer) private readonly emailProducer: IEmailProducer,
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<User> {
    // 2. Perform primary business/database logic
    const user = await this.userRepo.createUser(dto);

    // 3. Trigger the background email task asynchronously
    // This returns instantly because it just pushes a job to Redis, 
    // keeping your API response fast.
    await this.emailProducer.sendTransactional({
      to: user.email,
      subject: "Welcome to MyChange!",
      htmlBody: `<h1>Welcome, ${user.name}!</h1><p>We are glad to have you.</p>`,
      fromEmail: "no-reply@mychange.app",
    });

    return user;
  }
}
```

```ts
import type { Job } from "bullmq";
import { inject, injectable } from "inversify";
import { config } from "@/config/env";
import { pinoLogger } from "@/config/pino-logger";
import { BaseProcessor } from "@/core/queue/base.processor";
import type { EmailJobPayload } from "@/core/queue/payloads";
import { QUEUE_NAMES } from "@/core/queue/payloads"; // or queue.types
import { EMAIL_TYPES, type IEmailSender } from "./email.types";

@injectable()
export class EmailProcessor extends BaseProcessor<typeof QUEUE_NAMES.Email> {
  public readonly queueName = QUEUE_NAMES.Email;
  protected readonly concurrency = config.QUEUE_EMAIL_CONCURRENCY;
  protected readonly rateLimit = {
    max: config.QUEUE_EMAIL_RATE_MAX,
    duration: config.QUEUE_EMAIL_RATE_DURATION_MS,
  };

  constructor(
    @inject(EMAIL_TYPES.EmailSender) private readonly sender: IEmailSender,
  ) {
    super();
  }

  protected async handle(
    data: EmailJobPayload,
    job: Job<EmailJobPayload>,
  ): Promise<void> {
    try {
      pinoLogger.info(
        { jobId: job.id, to: data.to, attempt: job.attemptsMade + 1 },
        "Attempting to send email...",
      );

      await this.sender.send({
        to: data.to,
        subject: data.subject,
        htmlBody: data.htmlBody,
      });

    } catch (err) {
      pinoLogger.error(
        { jobId: job.id, to: data.to, attempt: job.attemptsMade, err },
        "Email delivery failed. BullMQ will handle retry strategy.",
      );
      
      // Throwing the error tells BullMQ to trigger the retry/backoff policy
      throw err; 
    }
  }
}
```

##
When you have multiple types of emails flowing through the same Email queue (e.g., onboarding welcomes, password resets, billing receipts) but want to process them differently, you can use a Discriminator Pattern (often called a routing or switch pattern) inside your processor.

Instead of writing a completely separate queue for every single email type, you include a type property in your payload. Your single EmailProcessor then routes the job to the correct logic based on that type.

Here is how to implement this cleanly in TypeScript:

```ts
export type OnboardingEmailPayload = {
  type: "ONBOARDING_WELCOME";
  to: string;
  name: string;
  temporaryToken: string;
};

export type PasswordResetEmailPayload = {
  type: "PASSWORD_RESET";
  to: string;
  resetLink: string;
};

// Combine them into a single union type for the queue map
export type EmailJobPayload = OnboardingEmailPayload | PasswordResetEmailPayload;
```
```ts
@injectable()
export class EmailProducer implements IEmailProducer {
    constructor(@inject(TYPES.QueueService) private readonly queues: IQueueService) {}

    async send(payload: EmailJobPayload) {
        const job = await this.queues.publish(QUEUE_NAMES.Email, payload);
        return { jobId: job.id };
    }
}
```

```ts
@injectable()
export class EmailProcessor extends BaseProcessor<typeof QUEUE_NAMES.Email> {
  public readonly queueName = QUEUE_NAMES.Email;
  protected readonly concurrency = 5;

  constructor(@inject(EMAIL_TYPES.EmailSender) private readonly sender: IEmailSender) {
    super();
  }

  protected async handle(
    data: EmailJobPayload,
    job: Job<EmailJobPayload>,
  ): Promise<void> {
    pinoLogger.info({ jobId: job.id, emailType: data.type }, "Processing email job...");

    // TypeScript narrows 'data' based on 'data.type' automatically!
    switch (data.type) {
      case "ONBOARDING_WELCOME":
        await this.sendOnboardingWelcome(data);
        break;

      case "PASSWORD_RESET":
        await this.sendPasswordReset(data);
        break;

      default:
        // Exhaustive check safety net
        const exhaustiveCheck: never = data;
        throw new Error(`Unhandled email type: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }

  private async sendOnboardingWelcome(data: OnboardingEmailPayload) {
    await this.sender.send({
      to: data.to,
      subject: "Welcome to MyChange!",
      htmlBody: `<h1>Welcome ${data.name}!</h1><p>Token: ${data.temporaryToken}</p>`,
    });
  }

  private async sendPasswordReset(data: PasswordResetEmailPayload) {
    await this.sender.send({
      to: data.to,
      subject: "Reset Your Password",
      htmlBody: `<p>Click <a href="${data.resetLink}">here</a> to reset your password.</p>`,
    });
  }
}
```
```ts
// In your Onboarding Service:
await this.emailProducer.send({
  type: "ONBOARDING_WELCOME",
  to: user.email,
  name: user.name,
  temporaryToken: stepToken,
});

// In your Auth Service (Password Reset):
await this.emailProducer.send({
  type: "PASSWORD_RESET",
  to: user.email,
  resetLink: "https://mychange.app/reset?token=xyz",
});
```