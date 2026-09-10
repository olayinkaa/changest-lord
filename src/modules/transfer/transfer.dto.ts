import { Type } from "class-transformer"
import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator"
import type { Prisma } from "@/generated/prisma/client"
import { TransactionType } from "@/generated/prisma/enums"

export type Decimal = Prisma.Decimal

class BankDetailsDto {
	@IsString()
	@IsNotEmpty()
	accountNumber: string

	@IsString()
	@IsNotEmpty()
	bankCode: string
}

export class ValidateAmountDto {
	@IsEnum(TransactionType)
	@IsNotEmpty()
	transactionType: TransactionType

	@IsString()
	@IsOptional()
	recipientId?: string

	@IsNumber()
	@IsNotEmpty()
	amount: Decimal

	@IsOptional()
	@ValidateNested()
	@Type(() => BankDetailsDto)
	bankDetails?: BankDetailsDto
}

export class ExecuteTransferDto {
	@IsEnum(TransactionType)
	@IsNotEmpty()
	transactionType: TransactionType

	@IsString()
	@IsOptional()
	recipientId?: string

	@IsNumber()
	@IsNotEmpty()
	amount: Decimal

	@IsString()
	@IsNotEmpty()
	pin: string

	@IsString()
	@IsNotEmpty()
	reference: string

	@IsOptional()
	@ValidateNested()
	@Type(() => BankDetailsDto)
	bankDetails?: BankDetailsDto
}
