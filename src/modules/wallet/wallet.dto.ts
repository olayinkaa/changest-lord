import { IsNotEmpty, IsNumber, IsString } from "class-validator"
import type { Decimal } from "./wallet.types"

export class TopUpWalletDto {
	@IsString()
	@IsNotEmpty()
	identifier: string

	@IsNumber()
	@IsNotEmpty()
	amount: Decimal
}
