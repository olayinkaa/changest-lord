import type { Prisma } from "@/generated/prisma/client"
import type { ChargeType, TransactionType } from "@/generated/prisma/enums"

export interface IChargeConfigService {
	calculateFee(
		type: TransactionType,
		amount: Prisma.Decimal,
	): Promise<{ fee: Prisma.Decimal; type: ChargeType }>
}

export const CHARGE_TYPES = {
	Service: Symbol.for("ChargeConfigService"),
}
