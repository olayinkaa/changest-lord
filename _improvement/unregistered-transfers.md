# Unregistered Recipient Transfers (Give Change)

This document describes the implementation of the "Give Change" feature, allowing sellers to send funds to phone numbers that are not yet registered on the platform.

## 1. Architectural Approach: The Transit-Claim Pattern

To maintain financial integrity without creating "ghost" users, the system uses a **Transit-Claim** pattern. Funds sent to unregistered numbers are held in escrow in a Transit wallet until the recipient registers.

### The Lifecycle of an Unregistered Transfer:

1. **Initiation**: A seller initiates a "Give Change" transfer to a phone number.
2. **Internal Validation**: The system checks if the phone number is registered.
3. **Escrow Movement**:
   - If the user is NOT registered, the funds are debited from the Seller and credited to a `TRANSIT` wallet.
   - The transaction is tagged with the recipient's phone number.
4. **User Registration**: The recipient eventually signs up and completes onboarding (`PIN_COMPLETED`).
5. **Fund Claiming**: During the final step of onboarding, the system checks for any pending credits in the Transit wallet for that phone number and automatically moves them to the new user's wallet.

## 2. Implementation Strategy

### Database Layer
- **LedgerTransaction**: Ensure the `description` or a specific metadata field captures the target phone number for unregistered transfers.
- **Wallet**: Use the existing `WalletType.TRANSIT` to hold the funds.

### Service Layer
- **TransferService**: Modify `executeTransfer` to allow transfers where the recipient is unregistered, provided the `transactionType` is `GIVE_CHANGE`.
- **OnboardingService**: Add a "Claim Funds" logic in the `createPin` method to sweep pending transit funds into the new user's wallet.

## 3. Security & Integrity
- **Strict Type Check**: Only `GIVE_CHANGE` transactions can be sent to unregistered numbers. Regular transfers still require a registered account.
- **Atomic Movement**: The move from Transit $\rightarrow$ User wallet is wrapped in a Prisma `$transaction` to ensure no money is lost or duplicated.
- **Audit Trail**: Every movement is recorded in the `Ledger` table, providing a full history of the fund's journey from Seller $\rightarrow$ Transit $\rightarrow$ User.
