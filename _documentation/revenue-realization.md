# Revenue Realization & The Money Pool

This document explains the relationship between virtual wallet balances and actual bank funds, specifically how the `SYSTEM_FEE` wallet translates into real-world corporate profit.

## 1. Virtual Balance vs. Actual Funds

In the myChange system, wallets do not hold "actual" money; they hold a **claim** to money. 

### The Omnibus Account Concept
The company maintains a large corporate bank account, known as an **Omnibus Account**. When a user deposits money into the platform, the actual funds land in this single bank account. The system then creates a virtual record in the `Wallet` model to track how much of that total pool belongs to that specific user.

**The Golden Equation:**
$\text{Total Bank Balance} = \sum (\text{All User Wallets}) + \sum (\text{All System Wallets})$

The `SYSTEM_FEE` wallet is simply a way of tagging a portion of the Omnibus Account as "Company Profit."

---

## 2. The "Settlement Sweep" Process

Since it is inefficient to move small fees to a separate bank account in real-time, the company performs a **Settlement Sweep** (typically on a daily or monthly cadence).

### The Sweep Workflow:
1. **Calculation**: The finance team identifies the current balance of the `SYSTEM_FEE` virtual wallet (e.g., 500,000 NGN).
2. **Bank Transfer**: A real-world bank transfer is executed from the **Omnibus Account** (User Pool) to the **Corporate Profit Account**.
3. **Ledger Adjustment**: To maintain the double-entry integrity, the virtual balance is reset:
   - **Debit `SYSTEM_FEE` Wallet**: -500,000 NGN
   - **Credit External Profit Account**: +500,000 NGN

This process converts a "virtual claim" into "actual liquidated cash" in the company's profit account.

---

## 3. Using Fees for Operational Costs

Not all fees are "profit." Some are used to cover the cost of providing the service.

**Example: Bank API Charges**
When a user performs a `TRANSFER_BANK` transaction, the external bank may charge the company a processing fee. 
- Instead of paying this from a separate budget, the company uses the funds accumulated in the `SYSTEM_FEE` wallet.
- In the ledger, this is recorded as a movement from the `SYSTEM_FEE` wallet to the external provider.

---

## Summary Table

| Stage | Actual Location of Funds | Ledger State |
| :--- | :--- | :--- |
| **User Deposit** | Corporate Omnibus Account | $\text{User Wallet} \uparrow$ |
| **Fee Charged** | Corporate Omnibus Account | $\text{User Wallet} \downarrow \rightarrow \text{SYSTEM\_FEE} \uparrow$ |
| **Profit Sweep** | Corporate Profit Account | $\text{SYSTEM\_FEE} \downarrow \rightarrow \text{Profit Account} \uparrow$ |
