# Internal API Key Protection for Public Endpoints

## Context
Certain endpoints (e.g., onboarding, internal system updates) are technically "public" because they are not called by an authenticated user session, but they must not be accessible to the open internet. They should only be callable by trusted internal services or specific partners.

## Proposed Approach: API Key Middleware

The most efficient way to secure these endpoints is via a Service-to-Service (S2S) authentication pattern using a shared secret (API Key).

### 1. Environment Configuration
Store a high-entropy secret in the environment variables to avoid hardcoding.

**`.env`**
```bash
INTERNAL_API_KEY=your_secure_random_string_here
```

### 2. Middleware Implementation
Create a middleware that intercepts requests and validates the presence and correctness of the key in the headers.

**`src/core/middleware/api-key.ts`**
```typescript
import { NextFunction, Request, Response } from "express";
import { ForbiddenException } from "@/core/errors/exceptions";
import { config } from "@/config/env";

export const ApiKeyGuard = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
        next(new ForbiddenException("API Key is missing"));
        return;
    }

    if (apiKey !== config.INTERNAL_API_KEY) {
        next(new ForbiddenException("Invalid API Key"));
        return;
    }

    next();
};
```

### 3. Application to Controllers
Apply the guard to specific endpoints. Note that this replaces `@AuthGuard()` for these routes since they are system-level calls, not user-level calls.

**`src/modules/onboarding/onboarding.controller.ts`**
```typescript
@controller("/onboarding")
export class OnboardingController extends BaseHttpController {
    
    @httpPost("/submit")
    @withMiddleware(ApiKeyGuard) 
    public async submitOnboarding(@requestBody() dto: OnboardingDto, @next() nxt: NextFunction) {
        // ... implementation
    }
}
```

## Security Comparison

| Feature | User Auth (`@AuthGuard`) | Internal Auth (`ApiKeyGuard`) |
| :--- | :--- | :--- |
| **Target** | End-User $\rightarrow$ Server | Server $\rightarrow$ Server |
| **Identity** | User ID (from JWT) | System Identity (Shared Secret) |
| **Header** | `Authorization: Bearer <token>` | `x-api-key: <secret>` |
| **Lifecycle** | Short-lived / Expiring | Long-lived / Rotated |

## Advanced Implementation Guide (Future Enhancements)

For higher security and scalability, the basic environment-based key should be evolved into a managed system.

### Phase 1: Database-backed & Hashed Keys
Instead of one key in `.env`, we manage multiple keys for different partners and store them as hashes.

**1. Prisma Model**
```prisma
model SystemApiKey {
    id          String   @id @default(uuid())
    clientName  String   @unique // e.g., "Payment-Gateway", "Partner-X"
    keyHash     String   @unique // SHA-256 hash of the key
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
}
```

**2. Hashing Logic (`src/utils/crypto.ts`)**
```typescript
import crypto from "node:crypto";

export const hashApiKey = (key: string): string => {
    return crypto.createHash("sha256").update(key).digest("hex");
};
```

**3. Validation Repository**
```typescript
async validateKey(providedKey: string): Promise<boolean> {
    const hashed = hashApiKey(providedKey);
    const record = await prisma.systemApiKey.findUnique({
        where: { keyHash: hashed },
    });
    return !!record?.isActive;
}
```

### Phase 2: IP Whitelisting
Prevent stolen keys from being used by restricting requests to specific source IPs.

**1. Model Extension**
Add an `allowedIps` field (String array) to the `SystemApiKey` model.

**2. Middleware Logic Update**
```typescript
const clientIp = req.ip || req.socket.remoteAddress;

if (record.allowedIps.length > 0 && !record.allowedIps.includes(clientIp)) {
    throw new ForbiddenException("Request origin not authorized");
}
```

### Phase 3: Integrated Secure Middleware
The final evolved middleware combines all these checks:

```typescript
export const AdvancedApiKeyGuard = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return next(new ForbiddenException("API Key missing"));

    const hashed = hashApiKey(apiKey);
    const keyRecord = await prisma.systemApiKey.findUnique({ where: { keyHash: hashed } });

    if (!keyRecord || !keyRecord.isActive) {
        return next(new ForbiddenException("Invalid or inactive API Key"));
    }

    const clientIp = req.ip;
    if (keyRecord.allowedIps.length > 0 && !keyRecord.allowedIps.includes(clientIp)) {
        return next(new ForbiddenException("IP not whitelisted"));
    }

    next();
};
```
