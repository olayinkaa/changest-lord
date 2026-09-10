import type { User } from "@/generated/prisma/client"
import type { TransactionType } from "@/generated/prisma/enums"
import type { Decimal } from "@/types/base"

export interface UserResponseDto {
	id: string
	firstName: string
	lastName: string
	phone: string
	virtualAccountNo: string
}

export interface ValidateAmountResponseDto {
	fee: Decimal
	totalDebit: Decimal
	reference: string
	message: string
}

export interface TransferResponseDto {
	reference: string
	status: string
	message: string
}

export interface ITransferService {
	searchRecipients(query: string): Promise<UserResponseDto>
	validateAmount(userId: string, dto: ValidateAmountDto): Promise<ValidateAmountResponseDto>
	executeTransfer(userId: string, dto: ExecuteTransferDto): Promise<TransferResponseDto>
}

export interface ITransferRepository {
	searchRecipients(query: string): Promise<User | null>
	getUserById(userId: string): Promise<User | null>
	updateUserSecurity(userId: string, data: { pinAttempts: number; isBlocked: boolean }): Promise<User>
	executeDoubleEntryTransfer(
		userId: string,
		recipientId: string | null,
		amount: Decimal,
		fee: Decimal,
		reference: string,
		transactionType: TransactionType,
	): Promise<string>
	executeSettlementSweep(amount: Decimal, reference: string): Promise<string>
}

export const TRANSFER_TYPES = {
	TransferService: Symbol.for("TransferService"),
	TransferRepository: Symbol.for("TransferRepository"),
	BankAdapter: Symbol.for("BankAdapter"),
}

export interface ValidateAmountDto {
	transactionType: TransactionType
	recipientId?: string
	amount: Decimal
	bankDetails?: {
		accountNumber: string
		bankCode: string
	}
}

export interface ExecuteTransferDto {
	transactionType: TransactionType
	recipientId?: string
	amount: Decimal
	pin: string
	reference: string
	bankDetails?: {
		accountNumber: string
		bankCode: string
	}
}
