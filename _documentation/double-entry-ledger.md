# Double-Entry Ledger System

## Overview
The myChange backend utilizes a **Double-Entry Ledger** system to manage all financial movements. This architecture ensures that money is never created or destroyed; it only moves between accounts. This is the gold standard for financial integrity, providing a complete audit trail and preventing funds from "vanishing" during complex transactions.

## The Fundamental Rule
Every transaction must consist of at least two entries: a **Debit** and a **Credit**. 
The sum of all entries within a single transaction ID must always equal **Zero**.

- **Debit (-)**: Money leaving a wallet.
- **Credit (+)**: Money entering a wallet.

## Example: Internal Transfer with Fee
**Scenario:** Alice sends 1,000 units to Bob. The system charges a 50 unit fee.

| Wallet | Type | Amount | Description |
| :--- | :--- | :--- | :--- |
| **Alice's Wallet** | DEBIT | `-1,050` | Transfer to Bob + Fee |
| **Bob's Wallet** | CREDIT | `+1,000` | Received from Alice |
| **System Wallet** | CREDIT | `+50` | Transfer Fee |
| **TOTAL** | | **0** | ✅ **Balanced** |

## Architectural Implementation

### 1. Wallet vs. Ledger
- **Wallet Table**: Stores the current `balance`. This acts as a high-speed cache for balance checks.
- **Ledger Table**: The immutable source of truth. Every change to a wallet balance must be accompanied by a corresponding ledger entry.

### 2. The Atomic Transaction
To prevent data inconsistency, wallet updates and ledger creations are wrapped in a **Prisma `$transaction`**.

**Workflow:**
1. **Lock**: Use `SELECT FOR UPDATE` on the involved wallets to prevent race conditions (double-spending).
2. **Validate**: Ensure the sender has sufficient funds (Balance $\ge$ Amount + Fee).
3. **Update**: Subtract from sender, add to recipient, add to system.
4. **Record**: Create the DEBIT and CREDIT rows in the Ledger table.

### 3. Handling "In-Flight" Funds (Bank Transfers)
For outbound bank transfers, money is moved to a **Transit/Settlement Wallet** instead of going directly to the destination.

1. **Step 1**: Debit Sender $\rightarrow$ Credit Transit Wallet.
2. **Step 2**: Trigger external Bank API.
3. **Step 3 (Success)**: Debit Transit Wallet $\rightarrow$ Credit External Bank.
4. **Step 3 (Failure)**: Debit Transit Wallet $\rightarrow$ Credit Sender (Refund).

This ensures that funds are always accounted for, even while waiting for external third-party confirmations.

## Why This is Essential
- **Auditability**: Every single cent can be traced back to its origin.
- **Integrity**: If the sum of all ledger entries is not zero, the system knows immediately that a data corruption or fraud event occurred.
- **Reliability**: Prevents "lost money" bugs that occur in simple balance-column updates.
