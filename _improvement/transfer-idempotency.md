# Idempotency Implementation for Fund Transfers

## The Problem
In the previous implementation, the transaction reference was generated inside the `executeTransfer` method. This created a race condition: if a user clicked the "Submit" button rapidly, the server would receive multiple requests, generate a *different* unique reference for each, and execute multiple debits for the same intended transfer (double-spending).

## The Solution: Reference Hand-off Flow

To prevent this, we implemented an **Idempotency Key** pattern using a "Reference Hand-off" flow.

### The Workflow
1. **Generation (Validation Phase)**:
   - When the user validates the transfer amount, the server generates the `transactionReference` using the `generateTransactionReference` utility.
   - This reference is returned to the client in the `ValidateAmountResponseDto`.
2. **Persistence (Client Side)**:
   - The frontend stores this reference.
3. **Execution (Submission Phase)**:
   - The client sends the same `reference` back to the server in the `ExecuteTransferDto`.
4. **Enforcement (Database Layer)**:
   - The `LedgerTransaction` model has a `@unique` constraint on the `reference` field.
   - If a second request with the same reference arrives, the database rejects the insertion.

### Code Implementation

**1. Service Layer Change:**
The reference is now generated in `validateAmount`:
```typescript
return {
  fee,
  totalDebit,
  reference: generateTransactionReference(transactionType),
  message: "Amount validated successfully",
};
```

**2. Handling Duplicates:**
In `executeTransfer`, we catch the Prisma `P2002` (Unique Constraint Violation) error:
```typescript
try {
  transactionReference = await this.transferRepo.executeDoubleEntryTransfer(...);
} catch (error: any) {
  if (error.code === "P2002") {
    throw new BadRequestException("This transaction has already been processed.");
  }
  // ... other errors
}
```

## Benefits
- **Zero Double-Spending**: It is mathematically impossible to execute the same transaction twice.
- **Improved UX**: Users receive a clear "already processed" message instead of a generic 500 error.
- **Audit Integrity**: The `LedgerTransaction` table remains a clean record of unique business events.
