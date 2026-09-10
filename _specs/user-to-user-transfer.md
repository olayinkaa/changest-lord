# Spec for Fund Transfer Service

branch: claude/feature/user-to-user-transfer

## Summary
Implement a comprehensive fund transfer system supporting multiple transaction types. The system allows users to search for recipients, check balances, and execute transfers using a double-entry ledger. Supported transaction types include internal peer-to-peer transfers, outbound bank transfers, and "Give Change" operations from sellers to customers.

## Functional Requirements

- **Transaction Types:**
    - `TRANSFER_MYCHANGE`: Internal transfer from one myChange user to another.
    - `TRANSFER_BANK`: Outbound transfer from a myChange user to an external bank account.
    - `GIVE_CHANGE`: A specific business operation where a seller sends money to a customer on myChange.

- **API Endpoints & Routing:**
    - `GET /api/v1/wallet/balance`
        - **Auth:** Required (JWT).
        - **Response:** `{ "balance": "number (Decimal)", "currency": "string" }`
    - `GET /api/v1/transfer/search?query=<id|phone>`
        - **Auth:** Required (JWT).
        - **Response:** User details object or 404 "No account matches the ID. check the number and try again".
    - `POST /api/v1/transfer/validate-amount`
        - **Auth:** Required (JWT).
        - **Request Payload:** 
          ```json
          {
            "transactionType": "TRANSFER_MYCHANGE | TRANSFER_BANK | GIVE_CHANGE",
            "recipientId": "string (UUID, optional for Bank)",
            "bankDetails": {
               "accountNumber": "string",
               "bankCode": "string"
            },
            "amount": "number (Decimal)"
          }
          ```
        - **Response:** 
          ```json
          {
            "fee": "number (Decimal)",
            "totalDebit": "number (Decimal)",
            "message": "Amount validated successfully"
          }
          ```
        - **Error:** 400 "insufficient balance".
    - `POST /api/v1/transfer/execute`
        - **Auth:** Required (JWT).
        - **Request Payload:** 
          ```json
          {
            "transactionType": "TRANSFER_MYCHANGE | TRANSFER_BANK | GIVE_CHANGE",
            "recipientId": "string (UUID, optional for Bank)",
            "bankDetails": {
               "accountNumber": "string",
               "bankCode": "string"
            },
            "amount": "number (Decimal)",
            "pin": "string"
          }
          ```
        - **Response:** Success confirmation with transaction ID.

- **Dependency Injection (InversifyJS):**
    - `TransferController`: Injected with `TransferService`.
    - `WalletController`: Injected with `WalletService`.
    - `TransferService`: Injected with `UserRepository`, `WalletRepository`, `LedgerRepository`, `AuthService`, `ChargeConfigService`, and `BankAdapter`.
    - Bindings:
        - `TYPES.TransferService` -> `TransferServiceImpl`
        - `TYPES.WalletRepository` -> `PrismaWalletRepository`
        - `TYPES.LedgerRepository` -> `PrismaLedgerRepository`
        - `TYPES.ChargeConfigService` -> `ChargeConfigServiceImpl`

- **Data Access & Prisma:**
    - **Precision Requirement:** All monetary values MUST use `Prisma.Decimal`.
    - **User Model**: Add `isBlocked` (boolean) and `pinAttempts` (int).
    - **Wallet Model**:
        - `id` (UUID), `userId` (Relation to User, optional for system/transit wallets), `currency` (String), `balance` (Decimal).
    - **Ledger Model (Double Entry)**:
        - `id` (UUID), `transactionId` (UUID).
        - `walletId` (Relation to Wallet).
        - `amount` (Decimal).
        - `type` (Enum: CREDIT, DEBIT).
        - `transactionType` (Enum: TRANSFER_MYCHANGE, TRANSFER_BANK, GIVE_CHANGE).
        - `description` (String), `createdAt` (DateTime).

- **Business Logic & Services:**
    - **Charge Calculation**:
        - `ChargeConfigService` must provide fees based on `transactionType`.
        - Different `CHARGE_TYPE` (FIXED/PERCENTAGE) and `CHARGE_VALUE` per transaction type.
    - **Execution Logic by Type**:
        - **`TRANSFER_MYCHANGE`**: Debit Sender $\rightarrow$ Credit Recipient + Credit System (Fees).
        - **`TRANSFER_BANK`**: Debit Sender $\rightarrow$ Credit Transit/Settlement Wallet + Credit System (Fees). Then trigger `BankAdapter` to move funds to the external bank.
        - **`GIVE_CHANGE`**: Debit Seller $\rightarrow$ Credit Customer + Credit System (Fees).
    - **Atomic Transaction**: All ledger movements must occur within a Prisma `$transaction`.
    - **PIN Security**: 3-strike block policy.

## Possible Edge Cases

- **Concurrent Transfers**: Use `SELECT FOR UPDATE` on wallets.
- **Bank Transfer Failure**: Handle `BankAdapter` failures by reversing the ledger entry or moving funds to a "Failed/Refund" wallet.
- **Insufficient Funds**: Validated at both `validate` and `execute` stages.
- **Wrong PIN**: Account blocking after 3 attempts.

## Acceptance Criteria

- [ ] All three transaction types (`TRANSFER_MYCHANGE`, `TRANSFER_BANK`, `GIVE_CHANGE`) are supported.
- [ ] Fees are correctly applied based on the `transactionType` from `ChargeConfigService`.
- [ ] Transfers are executed atomically using double-entry ledger (Debit = Sum of Credits).
- [ ] `TRANSFER_BANK` correctly interacts with the `BankAdapter`.
- [ ] PIN verification and account blocking work as specified.
- [ ] All monetary calculations use `Prisma.Decimal`.

## Open Questions
**All question below will be address after the implementation later**
- How are bank transfer failures handled (automatic refund vs manual)?
- Are there different PIN requirements for "Give Change" (Seller) vs regular transfers?

## Testing Guidelines

- **Unit Tests:**
    - `TransferService`: Test each `transactionType` path.
    - `ChargeConfigService`: Verify different fees for each type.
- **Integration Tests:**
    - Flow: search -> validate -> execute for all 3 types.
    - Verify ledger consistency across different transfer scenarios.
