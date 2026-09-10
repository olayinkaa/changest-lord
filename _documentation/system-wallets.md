# System Wallets & Revenue Tracking

This document explains the role of specialized system wallets—specifically the `SYSTEM_FEE` wallet—within the double-entry financial system.

## Overview

In a strict double-entry ledger system, money cannot be created or destroyed; it can only be moved from one account to another. When the platform charges a user a fee, that money must be moved into a designated account to keep the ledger balanced (sum to zero).

The `SYSTEM_FEE` wallet is a non-user account used to track the platform's earned revenue.

---

## Scenario: The Convenience Fee Flow

Consider a scenario where a user transfers funds internally with a convenience fee.

**The Setup:**
- **User A (Sender)**: Balance = 1,000 NGN
- **User B (Recipient)**: Balance = 0 NGN
- **System Wallet (`SYSTEM_FEE`)**: Balance = 0 NGN
- **Transaction**: User A sends **100 NGN** to User B.
- **Fee**: The system charges a **10 NGN** fee.

### The Atomic Movement
The system executes three movements in a single database transaction:

1. **Debit Sender**: User A is debited for the total cost.
   - `User A Wallet` $\rightarrow$ **-110 NGN**
   - `Ledger Entry`: `DEBIT | 110 NGN | "Transfer to User B + Fee"`

2. **Credit Recipient**: User B receives the net amount.
   - `User B Wallet` $\rightarrow$ **+100 NGN**
   - `Ledger Entry`: `CREDIT | 100 NGN | "Received from User A"`

3. **Credit System**: The platform collects the fee.
   - `SYSTEM_FEE Wallet` $\rightarrow$ **+10 NGN**
   - `Ledger Entry`: `CREDIT | 10 NGN | "Fee for Transaction MYCH-..."`

### Final Balance Sheet

| Account | Start | Change | End |
| :--- | :--- | :--- | :--- |
| User A | 1,000 | -110 | **890 NGN** |
| User B | 0 | +100 | **100 NGN** |
| **SYSTEM_FEE** | 0 | +10 | **10 NGN** |
| **Total** | **1,000** | **0** | **1,000 NGN** |

---

## Business Utility of the SYSTEM_FEE Wallet

The `SYSTEM_FEE` wallet serves several critical business functions:

### 1. Revenue Analytics
The company can calculate total revenue instantly by querying the balance of the `SYSTEM_FEE` wallet or summing its `CREDIT` entries. This removes the need to run expensive aggregations across millions of transaction rows.

### 2. Financial Auditing
It provides a perfect audit trail. Every single Naira earned by the platform is linked to a specific `LedgerTransaction` reference, making it easy to explain "where the money came from" during an audit.

### 3. Payout & Operational Funding
The balance in this virtual wallet represents the funds available to the company to:
- Pay for third-party API costs (e.g., Bank transfer fees).
- Fund operational expenses.
- Transfer accumulated profit to the company's actual corporate bank account.

## Summary
Without the `SYSTEM_FEE` wallet, the system would have "vanishing money," which violates accounting principles and makes financial reconciliation impossible. By treating revenue as a credit to a system wallet, the platform maintains 100% financial integrity.
