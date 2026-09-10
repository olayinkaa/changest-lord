import { injectable } from "inversify"
import { ChargeType, TransactionType } from "@/generated/prisma/client"
import { Prisma } from "@/types/prisma"
import type { IChargeConfigService } from "./charge.type"

@injectable()
export class ChargeConfigService implements IChargeConfigService {
	// In a real scenario, these would be fetched from a SystemSettings table or .env
	private readonly CONFIG = {
		[TransactionType.TRANSFER_MYCHANGE]: {
			type: ChargeType.FIXED,
			value: new Prisma.Decimal("0"),
		},
		[TransactionType.TRANSFER_BANK]: {
			type: ChargeType.PERCENTAGE,
			value: new Prisma.Decimal("1.5"),
		}, // 1.5%
		[TransactionType.GIVE_CHANGE]: {
			type: ChargeType.FIXED,
			value: new Prisma.Decimal("10"),
		},
		[TransactionType.SETTLEMENT_SWEEP]: {
			type: ChargeType.FIXED,
			value: new Prisma.Decimal("0"),
		},
	}

	public async calculateFee(
		type: TransactionType,
		amount: Prisma.Decimal,
	): Promise<{ fee: Prisma.Decimal; type: ChargeType }> {
		const config = this.CONFIG[type]
		let fee: Prisma.Decimal

		if (config.type === ChargeType.FIXED) {
			fee = config.value
		} else {
			// fee = amount * value / 100
			fee = amount.mul(config.value).div(100)
		}

		return {
			fee,
			type: config.type,
		}
	}
}
