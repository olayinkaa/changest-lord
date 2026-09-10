import type { ChargeType, TransactionType } from "@/generated/prisma/enums"
import type { Decimal } from "@/types/prisma"

export interface IChargeConfigService {
	calculateFee(type: TransactionType, amount: Decimal): Promise<{ fee: Decimal; type: ChargeType }>
}

export const CHARGE_TYPES = {
	Service: Symbol.for("ChargeConfigService"),
}
