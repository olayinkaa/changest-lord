import type { User } from "@/generated/prisma/client"
import type { TransactionStatus, TransactionType } from "@/generated/prisma/enums"
import type { Decimal } from "@/types/prisma"

export interface UserResponseDto {
	id: string
	name: string
	firstName: string
	lastName: string
	phone: string
	virtualAccountNo: string
}

export interface ValidateAmountResponseDto {
	fee: Decimal
	amount: Decimal
	totalDebit: Decimal
	reference: string
	message: string
}

export interface TransferResponseDto {
	reference: string
	status: string
	message: string
	transactionDate: Date
}

export interface ITransferService {
	searchRecipients(userId: string, query: string): Promise<UserResponseDto>
	validateRecipients(userId: string, data: string): Promise<UserResponseDto>
	validateAmount(userId: string, dto: ValidateAmountDto): Promise<ValidateAmountResponseDto>
	executeTransfer(userId: string, dto: ExecuteTransferDto): Promise<TransferResponseDto>
}

export interface ITransferRepository {
	searchRecipients(query: string): Promise<User | null>
	getUserById(userId: string): Promise<User | null>
	updateUserSecurity(userId: string, data: { pinAttempts: number; isBlocked: boolean }): Promise<User>
	executeDoubleEntryTransfer(
		userId: string,
		recipientUserId: string | null,
		amount: Decimal,
		fee: Decimal,
		reference: string,
		transactionType: TransactionType,
		recipientAccount?: string,
	): Promise<{ reference: string; createdAt: Date }>
	executeSettlementSweep(amount: Decimal, reference: string): Promise<string>
	updateTransactionStatus(reference: string, status: TransactionStatus): Promise<void>
}

export const TRANSFER_TYPES = {
	TransferService: Symbol.for("TransferService"),
	TransferRepository: Symbol.for("TransferRepository"),
	BankAdapter: Symbol.for("BankAdapter"),
}

export interface ValidateAmountDto {
	transactionType: TransactionType
	recipientAccount?: string
	amount: Decimal
	bankDetails?: {
		accountNumber: string
		bankCode: string
	}
}

export interface ExecuteTransferDto {
	transactionType: TransactionType
	recipientAccount?: string
	amount: Decimal
	pin: string
	reference: string
	bankDetails?: {
		accountNumber: string
		bankCode: string
	}
}
