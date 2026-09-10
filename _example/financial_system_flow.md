# Financial System Example: Wallet, Ledger & Charges

This document explains how the Wallet, Ledger, and Charge systems interact to ensure financial integrity using a double-entry bookkeeping system.

## 1. Model Relations

The system uses a "Header-Detail" pattern for transactions to ensure that every movement of money is accounted for and sums to zero.

### Entity Map
- **Wallet**: Stores the current balance of an account.
  - `USER` wallets belong to customers/sellers.
  - `SYSTEM_FEE` wallet collects revenue.
  - `TRANSIT` wallet holds funds during external bank transfers.
- **LedgerTransaction (The Header)**: Represents a single business event (e.g., "Transfer from User A to User B").
  - Has a unique `reference` (e.g., `MYCH-123456`).
  - Contains the `transactionType` (Internal, Bank, Give Change).
- **Ledger (The Entries)**: The individual debits and credits that make up a transaction.
  - Every `Ledger` entry links back to one `LedgerTransaction`.
  - Every `Ledger` entry links to one `Wallet`.
  - **Rule**: For any `LedgerTransaction`, the sum of all associated `Ledger` entries must be exactly **0**.

### Relation Diagram
`Wallet` (1) $\leftarrow$ (N) `Ledger` (N) $\rightarrow$ (1) `LedgerTransaction`

---

## 2. Concrete Example: Internal Transfer

**Scenario**: User A transfers **1,000 NGN** to User B.
**Charge**: Fixed fee of **10 NGN**.

### Financial Breakdown
- **User A (Sender)**: Debited **1,010 NGN** (Amount + Fee)
- **User B (Recipient)**: Credited **1,000 NGN**
- **System Wallet**: Credited **10 NGN** (Fee)
- **Total**: $-1010 + 1000 + 10 = 0$ (Balanced)

### Database State After Transaction

#### LedgerTransaction (Header)
| id | reference | transactionType | description |
| :--- | :--- | :--- | :--- |
| `tx_01` | `MYCH-999` | `TRANSFER_MYCHANGE` | Transfer from User A to User B |

#### Ledger (Entries)
| id | ledgerTransactionId | walletId | amount | type | description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `L1` | `tx_01` | `wallet_A` | `-1010.00` | `DEBIT` | Debit for TRANSFER_MYCHANGE - MYCH-999 |
| `L2` | `tx_01` | `wallet_B` | `1000.00` | `CREDIT` | Credit for TRANSFER_MYCHANGE - MYCH-999 |
| `L3` | `tx_01` | `wallet_sys` | `10.00` | `CREDIT` | Fee for TRANSFER_MYCHANGE - MYCH-999 |

---

## 3. Code Implementation Usage

The implementation uses a Prisma `$transaction` to ensure that either all movements happen or none do.

```typescript
// Simplified flow in TransferService
async execute(senderId, recipientId, amount) {
  const fee = await this.chargeConfig.calculateFee(type, amount);
  const totalDebit = amount.add(fee);
  const reference = generateReference();

  await prisma.$transaction(async (tx) => {
    // 1. Create Header
    const header = await tx.ledgerTransaction.create({
      data: { reference, transactionType: 'TRANSFER_MYCHANGE', ... }
    });

    // 2. Debit Sender
    await tx.wallet.update({ 
      where: { userId: senderId }, 
      data: { balance: { decrement: totalDebit } } 
    });
    await tx.ledger.create({ 
      data: { ledgerTransactionId: header.id, amount: totalDebit.mul(-1), type: 'DEBIT', ... } 
    });

    // 3. Credit Recipient
    await tx.wallet.update({ 
      where: { userId: recipientId }, 
      data: { balance: { increment: amount } } 
    });
    await tx.ledger.create({ 
      data: { ledgerTransactionId: header.id, amount: amount, type: 'CREDIT', ... } 
    });

    // 4. Credit System (Fee)
    await tx.wallet.update({ 
      where: { type: 'SYSTEM_FEE' }, 
      data: { balance: { increment: fee } } 
    });
    await tx.ledger.create({ 
      data: { ledgerTransactionId: header.id, amount: fee, type: 'CREDIT', ... } 
    });
  });
}
```

## 4. Why this approach?
1. **Auditability**: You can reconstruct the exact state of any wallet at any point in time by summing its ledger entries.
2. **Integrity**: The "sum to zero" rule makes it mathematically impossible for money to "vanish" or be "created" without a corresponding entry.
3. **Recovery**: If a bank transfer fails after the internal debit, the system can create a "Reversal" `LedgerTransaction` to return funds to the user, maintaining a perfect audit trail.
