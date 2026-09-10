# Transfer Flow & Idempotency Guide

This document explains the purpose of the `/validate-amount` endpoint and how the system prevents double-spending (idempotency) during fund transfers.

## 1. The `/validate-amount` Endpoint

The `/validate-amount` endpoint acts as a **pre-flight check**. Its goal is to verify that a transaction is viable *before* the user is asked for their secure PIN.

### Primary Responsibilities:
- **Balance Verification**: Checks if the sender has enough funds to cover the `Amount + Fee`.
- **Fee Calculation**: Determines the exact charge based on the `TransactionType` (Internal, Bank, or Give Change).
- **Reference Generation**: Generates the unique `transactionReference` used to lock the transaction.
- **User Experience**: Returns the exact total debit amount so the user can review it before confirming.

### Why `recipientId` is Optional?
In the `ValidateAmountDto`, the `recipientId` is optional because different transaction types have different requirements:
- **Internal Transfer**: Requires a `recipientId` to verify the account exists.
- **Bank Transfer**: Does not use a `recipientId`; it uses `bankDetails` (Account Number/Bank Code).
- **Give Change**: May use various identifiers depending on the seller's flow.

---

## 2. Preventing Double-Spending (Idempotency)

If a user clicks "Submit" rapidly, a naive system would execute the transfer multiple times. We prevent this using an **Idempotency Key** pattern.

### The Flow
1. **Validation Phase**: 
   - Server generates a unique reference (e.g., `MYCH-TMB-20260910-X7Y2P1`).
   - This reference is sent to the client.
2. **Execution Phase**: 
   - The client sends the same reference back in the `/execute` request.
3. **Database Enforcement**:
   - The `LedgerTransaction` table has a `@unique` constraint on the `reference` field.
   - If a second request arrives with the same reference, the database rejects the insert.
   - The server catches this error (`P2002`) and returns: *"This transaction has already been processed."*

### Comparison

| Feature | Naive Approach | Idempotent Approach (Current) |
| :--- | :--- | :--- |
| **Ref Generation** | Generated inside `execute` | Generated inside `validate` |
| **Rapid Clicks** | Multiple transfers created | Only the first request succeeds |
| **User Experience** | Account drained unexpectedly | Clear "already processed" message |
| **Integrity** | High risk of double-spending | Mathematically guaranteed uniqueness |

---

## 3. Sequence Summary

**User** $\xrightarrow{\text{Amount}}$ **`/validate-amount`** $\xrightarrow{\text{Fee + Ref}}$ **User** $\xrightarrow{\text{PIN + Ref}}$ **`/execute`** $\xrightarrow{\text{Success}}$ **User**
