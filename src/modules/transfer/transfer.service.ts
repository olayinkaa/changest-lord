import bcrypt from "bcryptjs"
import { inject, injectable } from "inversify"
import { CHARGE_TYPES, type IChargeConfigService } from "@/common/charge/charge.type"
import {
	BadRequestException,
	HttpException,
	UnauthorizedException,
} from "@/core/errors/exceptions"
import { Prisma, TransactionType } from "@/generated/prisma/client"
import { generateTransactionReference } from "@/utils/reference-generator"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import { type IWalletRepository, WALLET_TYPES } from "../wallet/wallet.types"
import {
	type ExecuteTransferDto,
	type ITransferRepository,
	type ITransferService,
	TRANSFER_TYPES,
	type TransferResponseDto,
	type UserResponseDto,
	type ValidateAmountDto,
	type ValidateAmountResponseDto,
} from "./transfer.types"

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
	) {}

	public async searchRecipients(query: string): Promise<UserResponseDto> {
		const user = await this.transferRepo.searchRecipients(query)

		if (!user) {
			throw new HttpException(
				404,
				"No account matches the ID. check the number and try again",
			)
		}

		return {
			id: user.id,
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			phone: user.phone,
			virtualAccountNo: user.virtualAccountNo || "",
		}
	}

	public async validateAmount(
		userId: string,
		dto: ValidateAmountDto,
	): Promise<ValidateAmountResponseDto> {
		const { transactionType, amount } = dto
		const decimalAmount = new Prisma.Decimal(amount)

		const { fee } = await this.chargeConfig.calculateFee(transactionType, decimalAmount)
		const totalDebit = decimalAmount.add(fee)

		const wallet = await this.walletRepo.findByUserId(userId)
		if (!wallet || wallet.balance.lt(totalDebit)) {
			throw new BadRequestException("insufficient balance")
		}

		return {
			fee,
			totalDebit,
			reference: generateTransactionReference(transactionType),
			message: "Amount validated successfully",
		}
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
		} = dto
		const amount = new Prisma.Decimal(rawAmount)

		// 1. Security: Check for blocked account
		const user = await this.userRepo.findUser(userId)
		if (!user) throw new UnauthorizedException("User not found")
		if (user.isBlocked)
			throw new UnauthorizedException("Your account is blocked. Please contact support.")

		// 2. PIN Verification
		const isPinCorrect = await this.verifyPin(user, pin)
		if (!isPinCorrect) {
			await this.userRepo.updatePinAttempts(userId, false)
			const updatedUser = await this.userRepo.findUser(userId)
			if (updatedUser && updatedUser.pinAttempts >= 3) {
				await this.userRepo.blockUser(userId)
			}

			throw new UnauthorizedException(
				"Incorrect PIN. Please try again. After 3 failed attempts, your account will be blocked",
			)
		}

		// Reset PIN attempts on success
		await this.userRepo.updatePinAttempts(userId, true)

		// 3. Fee Calculation
		const { fee } = await this.chargeConfig.calculateFee(transactionType, amount)

		// 4. Atomic Double-Entry Transaction
		let transactionReference: string
		try {
			transactionReference = await this.transferRepo.executeDoubleEntryTransfer(
				userId,
				recipientId || null,
				amount,
				fee,
				reference,
				transactionType,
			)
		} catch (error: any) {
			if (error instanceof BadRequestException) throw error
			if (error.code === "P2002") {
				throw new BadRequestException("This transaction has already been processed.")
			}
			throw new HttpException(500, `Transfer failed: ${error.message}`)
		}

		// 5. Outbound Bank Trigger
		if (transactionType === TransactionType.TRANSFER_BANK && bankDetails) {
			// await this.bankAdapter.transferFunds(
			//   bankDetails.accountNumber,
			//   bankDetails.bankCode,
			//   amount,
			//   reference,
			// );
		}

		return {
			reference: transactionReference,
			status: "SUCCESS",
			message: "Transfer completed successfully",
		}
	}

	private async verifyPin(user: any, pin: string): Promise<boolean> {
		if (!user.pinHash) return false
		return bcrypt.compare(pin, user.pinHash)
	}
}
