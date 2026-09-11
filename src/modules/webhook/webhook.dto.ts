import { Type } from "class-transformer"
import { IsDecimal, IsNotEmpty, IsString, ValidateNested } from "class-validator"

export class DepositWebhookDataDto {
	@IsString()
	@IsNotEmpty()
	id!: string

	@IsDecimal()
	amount!: string

	@IsString()
	@IsNotEmpty()
	currency!: string

	@IsString()
	@IsNotEmpty()
	reference!: string

	@IsString()
	@IsNotEmpty()
	bankReference!: string

	@IsString()
	@IsNotEmpty()
	bankAccountName!: string

	@IsString()
	@IsNotEmpty()
	sourceBankAccountName!: string

	@IsString()
	@IsNotEmpty()
	sourceBankAccountNumber!: string
}

export class DepositWebhookDto {
	@IsString()
	@IsNotEmpty()
	event!: string

	@ValidateNested()
	@Type(() => DepositWebhookDataDto)
	data!: DepositWebhookDataDto
}
