```ts
import { inject, injectable } from "inversify";
import { ADAPTER_TYPES } from "@/adapters/adapters.types";
import type { IBankAdapter } from "@/adapters/payment/bank.adapter";
import {
  CHARGE_TYPES,
  type IChargeConfigService,
} from "@/common/charge/charge.type";
import { pinoLogger } from "@/config/pino-logger";
import {
  BadRequestException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "@/core/errors/exceptions";
import { Prisma, TransactionType } from "@/generated/prisma/client";
import { generateTransactionReference } from "@/utils/reference-generator";
import { AUTH_TYPES, type IAuthUtils } from "../auth/auth.types";
import { type IUserRepository, USER_TYPES } from "../user/user.types";
import { type IWalletRepository, WALLET_TYPES } from "../wallet/wallet.types";
import {
  type ExecuteTransferDto,
  type ITransferRepository,
  type ITransferService,
  TRANSFER_TYPES,
  type TransferResponseDto,
  type UserResponseDto,
  type ValidateAmountDto,
  type ValidateAmountResponseDto,
} from "./transfer.types";

@injectable()
export class TransferServiceImpl implements ITransferService {
  constructor(
    @inject(TRANSFER_TYPES.TransferRepository)
    private transferRepo: ITransferRepository,
    @inject(WALLET_TYPES.Repository)
    private walletRepo: IWalletRepository,
    @inject(CHARGE_TYPES.Service)
    private chargeConfig: IChargeConfigService,
    @inject(USER_TYPES.Repository)
    private userRepo: IUserRepository,
    @inject(ADAPTER_TYPES.BankAdapter)
    private bankAdapter: IBankAdapter,
    @inject(AUTH_TYPES.AuthUtils)
    private authUtils: IAuthUtils,
  ) {}

  public async searchRecipients(query: string): Promise<UserResponseDto> {
    if (!query) {
      throw new BadRequestException(
        "Query parameter 'phoneOrUseId' is required",
      );
    }

    const user = await this.transferRepo.searchRecipients(query);

    if (!user) {
      throw new NotFoundException(
        "No account matches the ID. check the number and try again",
      );
    }

    return {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone,
      virtualAccountNo: user.userId5 || "",
    };
  }

  public async validateAmount(
    userId: string,
    dto: ValidateAmountDto,
  ): Promise<ValidateAmountResponseDto> {
    const { transactionType, amount } = dto;
    const decimalAmount = new Prisma.Decimal(amount);

    const { fee } = await this.chargeConfig.calculateFee(
      transactionType,
      decimalAmount,
    );
    const totalDebit = decimalAmount.add(fee);

    pinoLogger.info({ decimalAmount, fee, totalDebit });

    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet || wallet.balance.lt(totalDebit)) {
      throw new BadRequestException("insufficient balance");
    }

    return {
      message: "Amount validated successfully",
      amount: decimalAmount,
      fee,
      totalDebit,
      reference: generateTransactionReference(transactionType),
    };
  }

  public async executeTransfer(
    userId: string,
    dto: ExecuteTransferDto,
  ): Promise<TransferResponseDto> {
    const {
      transactionType,
      recipientId,
      amount: rawAmount,
      pin,
      reference,
      bankDetails,
    } = dto;
    const amount = new Prisma.Decimal(rawAmount);

    // 1. Security: Check for blocked account
    const user = await this.userRepo.findUser(userId);
    if (!user) throw new UnauthorizedException("User not found");
    if (user.isBlocked)
      throw new UnauthorizedException(
        "Your account is blocked. Please contact support.",
      );

    // 2. PIN Verification
    if (!user.pinHash) {
      throw new UnauthorizedException("Invalid phone number or PIN");
    }
    const isPinCorrect = await this.authUtils.verifyPin(pin, user.pinHash);
    if (!isPinCorrect) {
      await this.userRepo.updatePinAttempts(userId, false);
      const updatedUser = await this.userRepo.findUser(userId);
      if (updatedUser && updatedUser.pinAttempts >= 3) {
        await this.userRepo.blockUser(userId);
      }

      throw new UnauthorizedException(
        "Incorrect PIN. Please try again. After 3 failed attempts, your account will be blocked",
      );
    }

    // Reset PIN attempts on success
    await this.userRepo.updatePinAttempts(userId, true);

    // 3. Fee Calculation
    const { fee } = await this.chargeConfig.calculateFee(
      transactionType,
      amount,
    );

    // 4. Atomic Double-Entry Transaction
    let transactionReference: string;
    try {
      transactionReference = await this.transferRepo.executeDoubleEntryTransfer(
        userId,
        recipientId || null,
        amount,
        fee,
        reference,
        transactionType,
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === "P2002") {
        throw new BadRequestException(
          "This transaction has already been processed.",
        );
      }
      throw new HttpException(500, `Transfer failed: ${error.message}`);
    }

    // 5. Outbound Bank Trigger
    if (transactionType === TransactionType.TRANSFER_BANK && bankDetails) {
      const bankResult = await this.bankAdapter.transferFunds(
        bankDetails.accountNumber,
        bankDetails.bankCode,
        amount,
        reference,
      );
      if (bankResult.status === "FAILED") {
        pinoLogger.error(
          {
            reference: transactionReference,
            errorMessage: bankResult.errorMessage,
          },
          "Bank transfer trigger failed. Transaction is recorded in ledger but outbound funds failed.",
        );
        // In a real system, we might trigger a reconciliation job or automatic refund here.
      }
    }

    return {
      reference: transactionReference,
      status: "SUCCESS",
      message: "Transfer completed successfully",
    };
  }
}

```