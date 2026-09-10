# Transfer API Usage Examples

This document provides sample request payloads for the fund transfer endpoints in the MyChange system.

## Base Endpoint
`POST /api/v1/transfer/execute`

## Scenarios

### 1. Sending to a Registered Phone Number
Use this when the recipient is already a fully registered user.

**Request Payload:**
```json
{
  "transactionType": "TRANSFER_MYCHANGE",
  "recipientAccount": "+2348012345678",
  "amount": 500,
  "pin": "1234",
  "reference": "TXN-USER-101"
}
```
**Behavior:** System resolves the phone number to a `recipientUserId` $\rightarrow$ credits the user's wallet directly.

---

### 2. Sending to a Registered userId5 (Virtual Account)
Use this when the recipient provides their MyChange Virtual ID.

**Request Payload:**
```json
{
  "transactionType": "TRANSFER_MYCHANGE",
  "recipientAccount": "mychange_987654321",
  "amount": 1000,
  "pin": "1234",
  "reference": "TXN-USER-102"
}
```
**Behavior:** System resolves the `userId5` to a `recipientUserId` $\rightarrow$ credits the user's wallet directly.

---

### 3. Sending to an Unregistered Phone Number ("Give Change")
Use this when the recipient is not yet registered or has only partially completed onboarding.

**Request Payload:**
```json
{
  "transactionType": "GIVE_CHANGE",
  "recipientAccount": "+2348000000000",
  "amount": 50,
  "pin": "1234",
  "reference": "GC-SENDER-201"
}
```
**Behavior:** System finds no `recipientUserId` $\rightarrow$ credits the **Transit Wallet**. A ledger entry is created as a "claim ticket" for the phone number. Funds are claimed automatically when the user completes onboarding.

---

### 4. Sending to a Bank Account (Outbound)
Use this for transfers to external bank accounts.

**Request Payload:**
```json
{
  "transactionType": "TRANSFER_BANK",
  "recipientAccount": "+2348012345678",
  "amount": 5000,
  "pin": "1234",
  "reference": "BANK-TXN-301",
  "bankDetails": {
    "accountNumber": "0123456789",
    "bankCode": "058"
  }
}
```
**Behavior:** Funds are credited to the **Transit Wallet** $\rightarrow$ A BullMQ job is queued to process the actual bank transfer via the Bank Adapter.

## Summary Matrix

| Scenario | `transactionType` | `recipientAccount` | Target Wallet | Final Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Registered Phone** | `TRANSFER_MYCHANGE` | `"+234..."` | User Wallet | Immediate Credit |
| **Registered ID** | `TRANSFER_MYCHANGE` | `"mychange_..."` | User Wallet | Immediate Credit |
| **Unregistered** | `GIVE_CHANGE` | `"+234..."` | Transit Wallet | Escrow $\rightarrow$ Claimed on Onboarding |
| **External Bank** | `TRANSFER_BANK` | `"+234..."` | Transit Wallet | Escrow $\rightarrow$ Async Bank Payout |
