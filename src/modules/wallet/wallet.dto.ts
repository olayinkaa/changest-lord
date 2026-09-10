import { IsNotEmpty, IsNumber, IsString } from "class-validator"
import type { Decimal } from "./wallet.types"

export class TopUpWalletDto {
	@IsString()
	@IsNotEmpty()
	userId: string

	@IsNumber()
	@IsNotEmpty()
	amount: Decimal
}
