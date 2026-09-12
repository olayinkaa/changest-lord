# Webhook Security & Audit Implementation

This document describes the implementation of the webhook security layer and the audit logging system used to handle external signals (e.g., from Brails).

## 1. Request Authentication (HMAC Verification)

To prevent request forgery, all incoming webhooks must be verified using an HMAC-SHA256 signature.

### Raw Body Preservation
Because HMAC signatures are calculated based on the exact bytes of the request, any modification (like JSON parsing) would invalidate the signature. We preserve the original buffer in `src/index.ts`:

```typescript
app.use(
  express.json({
    verify: (req: any, _, buf) => {
      req.rawBody = buf;
    },
  }),
);
```

### Verification Flow
The `WebhookAuthMiddleware` performs the following steps:
1. Extracts the `x-brails-signature` header.
2. Retrieves the `BRAILS_WEBHOOK_SECRET` from environment variables.
3. Computes a HMAC-SHA256 hash of `req.rawBody`.
4. Compares the computed hash with the received signature.

If they do not match, a `401 Unauthorized` response is returned.

## 2. Audit Logging (Capture-then-Process)

Every webhook request is recorded in the database to provide an immutable audit trail for financial movements.

### Data Model
The `WebhookLog` model captures:
- **Payload**: The raw JSON received from the provider.
- **Response**: The response returned by our server.
- **Error**: A structured JSON object containing the error message and stack trace if processing fails.
- **Status**: The outcome of the request (`PENDING`, `SUCCESS`, `FAILED`, `IGNORED`).
- **User Link**: The `userId` resolved from the virtual account number.

### Lifecycle
The `WebhookService` implements a "Capture-then-Process" pattern:
1. **Immediate Capture**: A log entry is created with status `PENDING` as soon as the request hits the service.
2. **Processing**: The event is dispatched to the appropriate handler (e.g., `handleDepositSuccess`).
3. **Finalization**: 
   - **Success**: Log updated to `SUCCESS`.
   - **Idempotency Hit**: If the transaction reference was already processed, log is updated to `IGNORED`.
   - **Unhandled Event**: Log is updated to `IGNORED`.
   - **Exception**: Log is updated to `FAILED` with structured error details.

## 3. Real-time Notifications (SSE)

To ensure the user sees their updated balance immediately after a webhook is processed, the system emits a `BALANCE_UPDATED` event via SSE.

**Payload Example:**
```json
{
  "newBalance": "1500.50",
  "currency": "NGN",
  "transactionId": "ref_123",
  "changeAmount": "50.00",
  "changeType": "CREDIT"
}
```
