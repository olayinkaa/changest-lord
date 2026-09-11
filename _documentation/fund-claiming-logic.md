# Fund Claiming & Escrow Logic

This document explains how the system handles funds sent to unregistered or half-onboarded users via the "Give Change" flow.

## The Problem: The "Half-Onboarded" User
A user may have a record in the `User` table (from the first step of onboarding) but no corresponding `Wallet` record (because they haven't reached the PIN creation step). If we attempt a standard transfer, the system would fail because it cannot find a wallet to credit.

## The Solution: The Transit Wallet (Escrow)

When a transfer is initiated to a recipient who does not yet have a wallet, the system routes the funds to a specialized system wallet called the **Transit Wallet**.

### 1. The Deposit Phase
When a `GIVE_CHANGE` or `TRANSFER_BANK` transaction occurs and no recipient wallet is found:
1.  The funds are credited to the **Transit Wallet**.
2.  A `Ledger` entry is created with `type: CREDIT`.
3.  The `LedgerTransaction` header stores the `recipientAccount` (the phone number or virtual ID).

### 2. The Claim Process
The money is "claimed" automatically the moment the user completes the final step of onboarding (`createPin`).

**The Workflow:**
1.  **Scan**: The system queries the `Ledger` for all `CREDIT` entries where:
    - `wallet.type == 'TRANSIT'`
    - `transaction.recipientAccount == user.phone`
    - `claimed == false`
2.  **Atomic Move**: For each pending credit, the system executes a transaction:
    - **Mark as Claimed**: Sets `ledger.claimed = true` on the original credit entry.
    - **Debit Transit**: Subtracts the amount from the Transit Wallet.
    - **Credit User**: Adds the amount to the newly created User Wallet.
    - **Audit**: Creates new ledger entries to document the claim.

## Understanding the `claimed` Field

The `claimed` field in the `Ledger` table is a boolean marker used to prevent "double-claiming" (an infinite money glitch).

| Ledger Entry Type | Wallet Type | `claimed` Value | Logic Meaning |
| :--- | :--- | :--- | :--- |
| **CREDIT** | **TRANSIT** | `false` | **Available to be claimed** |
| **CREDIT** | **TRANSIT** | `true` | **Already claimed (ignore)** |
| **CREDIT** | **USER** | `false` | User already owns it (ignore) |
| **DEBIT** | **ANY** | `false` | Money left the wallet (ignore) |

### Why this is secure:
By marking the original transit credit as `claimed: true` within the same atomic transaction that credits the user, we guarantee that every single cent in the Transit wallet is moved exactly once. Even if the onboarding process is triggered multiple times, only the records with `claimed: false` will be processed.
