# Fund Transfer System Improvements

This document outlines the critical improvements made to the fund transfer system to ensure financial integrity, security, and scalability.

## 1. Financial Integrity & Race Condition Prevention
To prevent "double-spending" and negative balances, a strict internal verification layer was added.

- **Atomic Balance Checks**: The balance check was moved *inside* the Prisma `$transaction` in `TransferRepository.executeDoubleEntryTransfer`.
- **Why**: In a high-concurrency environment, a user could trigger multiple transfers simultaneously. Checking the balance in the service layer (outside the transaction) allows multiple requests to pass the check before the first one actually debits the account. Performing the check inside the transaction ensures that the balance is verified at the exact moment of debit.

## 2. Transaction Lifecycle Tracking
Introduced a state machine for transactions to replace the implicit "success/fail" model.

- **`TransactionStatus` Enum**:
    - `PENDING`: Transaction created and funds moved internally.
    - `SUCCESS`: End-to-end completion (internal + external).
    - `FAILED`: Transaction terminated.
    - `PARTIAL_SUCCESS`: Internal movement succeeded, but external delivery (Bank API) failed.
    - `REVERSED`: Funds returned to sender.
- **Auditability**: By tracking `PARTIAL_SUCCESS`, the system can now identify "stuck" funds in the Transit wallet that require manual intervention or automated recovery.

## 3. Asynchronous External Integration (Bank Transfers)
Moved external API calls from the request-response cycle to a background worker using BullMQ.

- **Async Flow**: 
    1. Internal Ledger Move $\rightarrow$ status `PENDING`.
    2. Enqueue `BankTransfer` job.
    3. Return `PROCESSING` status to user immediately.
    4. Background Worker executes bank call $\rightarrow$ updates status to `SUCCESS` or `PARTIAL_SUCCESS`.
- **Benefits**:
    - **Zero Latency**: Users don't wait for slow external bank APIs.
    - **Resilience**: Implemented automatic retries for transient network failures.
    - **Stability**: Prevents API timeouts and hanging requests in the main service.

## 4. Enhanced Security & User Experience
Refined the account blocking logic for failed PIN attempts.

- **Explicit Blocking Notification**: Updated the PIN verification flow to throw a specific `UnauthorizedException` when the 3rd attempt fails.
- **UX**: Instead of a generic warning, the user is now explicitly told: *"Incorrect PIN. Too many failed attempts. Your account has been blocked. Please contact support."*
