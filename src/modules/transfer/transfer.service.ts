import { inject, injectable } from "inversify"
import { CHARGE_TYPES, type IChargeConfigService } from "@/common/charge/charge.type"
import { pinoLogger } from "@/config/pino-logger"
import { type IQueueService, QUEUE_TYPES } from "@/core/bullmq/queue.types"
import { QUEUE_NAMES } from "@/core/bullmq/queue-name"
import { BadRequestException, HttpException, NotFoundException, UnauthorizedException } from "@/core/errors/exceptions"
import { TransactionType } from "@/generated/prisma/enums"
import { ErrorType } from "@/types/enum"
import { Prisma } from "@/types/prisma"
import { generateTransactionReference } from "@/utils/reference-generator"
import { AUTH_TYPES, type IAuthUtils } from "../auth/auth.types"
import { type ISseService, SSE_TYPES, SseEvent } from "../sse/sse.types"
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
export class TransferService implements ITransferService {
	constructor(
		@inject(TRANSFER_TYPES.TransferRepository)
		private transferRepo: ITransferRepository,
		@inject(WALLET_TYPES.Repository)
		private walletRepo: IWalletRepository,
		@inject(CHARGE_TYPES.Service)
		private chargeConfig: IChargeConfigService,
		@inject(USER_TYPES.Repository)
		private userRepo: IUserRepository,
		@inject(AUTH_TYPES.AuthUtils)
		private authUtils: IAuthUtils,
		@inject(QUEUE_TYPES.QueueService)
		private queueService: IQueueService,
		@inject(SSE_TYPES.Service)
		private sseService: ISseService,
	) {}

	public async searchRecipients(userId: string, query: string): Promise<UserResponseDto> {
		if (!query) {
			throw new BadRequestException("Query parameter 'phoneOrUserId' is required")
		}

		const user = await this.transferRepo.searchRecipients(query)

		if (!user) {
			throw new NotFoundException("No account matches the ID. check the number and try again")
		}

		if (user.id === userId) {
			throw new NotFoundException("You cannot transfer money to yourself.")
		}

		return {
			id: user.id,
			name: `${user?.firstName} ${user?.lastName}` || "",
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			phone: user.phone,
			virtualAccountNo: user.userId5 || "",
		}
	}

	public async validateRecipients(userId: string, data: string): Promise<UserResponseDto> {
		if (!data) {
			throw new BadRequestException("Phone or UserId is required")
		}

		const user = await this.transferRepo.searchRecipients(data)

		if (!user) {
			throw new NotFoundException("No account matches the ID. check the number and try again", {
				errorType: ErrorType.USER_NOT_FOUND,
			})
		}

		if (user.id === userId) {
			throw new NotFoundException("You cannot transfer money to yourself.")
		}

		return {
			id: user.id,
			name: `${user?.firstName} ${user?.lastName}` || "",
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			phone: user.phone,
			virtualAccountNo: user.userId5 || "",
		}
	}

	public async validateAmount(userId: string, dto: ValidateAmountDto): Promise<ValidateAmountResponseDto> {
		const { transactionType, amount } = dto
		const decimalAmount = new Prisma.Decimal(amount)

		const { fee } = await this.chargeConfig.calculateFee(transactionType, decimalAmount)
		const totalDebit = decimalAmount.add(fee)

		pinoLogger.info({ decimalAmount, fee, totalDebit })

		const wallet = await this.walletRepo.findByUserId(userId)
		if (!wallet || wallet.balance.lt(totalDebit)) {
			throw new BadRequestException("insufficient balance")
		}

		return {
			message: "Amount validated successfully",
			amount: decimalAmount,
			fee,
			totalDebit,
			reference: generateTransactionReference(transactionType),
		}
	}

	public async executeTransfer(userId: string, dto: ExecuteTransferDto): Promise<TransferResponseDto> {
		const { transactionType, recipientAccount, amount: rawAmount, pin, reference } = dto
		const amount = new Prisma.Decimal(rawAmount)

		// 1. Security: Check for blocked account
		const user = await this.userRepo.findUser(userId)
		if (!user) throw new NotFoundException("User not found")
		if (user.isBlocked) throw new UnauthorizedException("Your account is blocked. Please contact support.")

		// 2. PIN Verification
		if (!user.pinHash) {
			throw new BadRequestException("Invalid phone number or PIN")
		}
		const isPinCorrect = this.authUtils.verifyPin(pin, user.pinHash)
		if (!isPinCorrect) {
			await this.userRepo.updatePinAttempts(userId, false)
			const updatedUser = await this.userRepo.findUser(userId)
			if (updatedUser && updatedUser.pinAttempts >= 3) {
				await this.userRepo.blockUser(userId)
				throw new UnauthorizedException(
					"Incorrect PIN. Too many failed attempts. Your account has been blocked. Please contact support.",
				)
			}

			throw new BadRequestException(
				"Incorrect PIN. Please try again. After 3 failed attempts, your account will be blocked",
			)
		}

		// Reset PIN attempts on success
		await this.userRepo.updatePinAttempts(userId, true)

		// 3. Fee Calculation
		const { fee } = await this.chargeConfig.calculateFee(transactionType, amount)

		// 4. Resolve Recipient to User ID
		let recipientUserId: string | null = recipientAccount ?? null
		if (recipientAccount && transactionType !== TransactionType.TRANSFER_BANK) {
			const recipient = await this.transferRepo.searchRecipients(recipientAccount)
			if (!recipient) {
				// Allow unregistered recipients only for GIVE_CHANGE
				if (transactionType === TransactionType.GIVE_CHANGE) {
					pinoLogger.info({ recipientAccount }, "Recipient unregistered; funds will be held in Transit wallet")
					recipientUserId = null // Repository will handle as Transit
				} else {
					throw new NotFoundException("Recipient account not found. Please check the phone number or User ID.")
				}
			} else {
				recipientUserId = recipient.id
			}
		}

		// 5. Prevent self-transfer
		if (recipientUserId === userId) {
			throw new BadRequestException("You cannot transfer money to yourself.")
		}

		// 6. Atomic Double-Entry Transaction
		let transferResult: { reference: string; createdAt: Date }
		try {
			transferResult = await this.transferRepo.executeDoubleEntryTransfer(
				userId,
				recipientUserId || null,
				amount,
				fee,
				reference,
				transactionType,
				recipientAccount,
			)
		} catch (error: any) {
			if (error instanceof BadRequestException) throw error
			if (error.code === "P2002") {
				throw new BadRequestException("This transaction has already been processed.")
			}
			throw new HttpException(500, `Transfer failed: ${error.message}`)
		}

		const { reference: transactionReference, createdAt } = transferResult

		// 7. SSE Notifications for Sender and Receiver
		try {
			// Notify Sender
			await this.sseService.emitEvent(userId, SseEvent.TransferCompleted, {
				reference: transactionReference,
				amount: amount.toString(),
				type: "DEBIT",
				user: recipientAccount || "Unknown",
				status: "SUCCESS",
			})

			// Notify Receiver if internal
			if (recipientUserId) {
				await this.sseService.emitEvent(recipientUserId, SseEvent.TransferCompleted, {
					reference: transactionReference,
					amount: amount.toString(),
					type: "CREDIT",
					user: userId,
					status: "SUCCESS",
				})
			}
		} catch (sseError) {
			pinoLogger.error({ sseError }, "Failed to emit transfer SSE events")
			// We don't throw here because the transaction is already committed
		}

		// 8. External Bank Trigger (Async via Queue)
		if (transactionType === "TRANSFER_BANK" && dto.bankDetails) {
			const { accountNumber, bankCode } = dto.bankDetails

			await this.queueService.publish(QUEUE_NAMES.BankTransfer, {
				reference: transactionReference,
				accountNumber,
				bankCode,
				amount: amount.toString(),
			})

			return {
				message: "Transfer is being processed and will be completed shortly",
				reference: transactionReference,
				status: "PROCESSING",
				transactionDate: createdAt,
			}
		}

		// Finalize as SUCCESS for internal transfers
		return {
			reference: transactionReference,
			status: "SUCCESS",
			message: "Transfer completed successfully",
			transactionDate: createdAt,
		}
	}

	public async getTransitTransactions(recipientAccount?: string): Promise<any[]> {
		return this.transferRepo.findTransitTransactions(recipientAccount)
	}
}
