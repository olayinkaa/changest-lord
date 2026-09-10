import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { Prisma } from "@/types/prisma"
import { generateTransactionReference } from "@/utils/reference-generator"
import { type ITransferRepository, TRANSFER_TYPES } from "../transfer/transfer.types"
import { type IWalletRepository, WALLET_TYPES } from "../wallet/wallet.types"

export interface ISettlementService {
	sweepSystemFees(): Promise<{
		amountSwept: Prisma.Decimal
		reference: string
	}>
}

@injectable()
export class SettlementServiceImpl implements ISettlementService {
	constructor(
		@inject(TRANSFER_TYPES.TransferRepository)
		private transferRepo: ITransferRepository,
		@inject(WALLET_TYPES.Repository)
		private walletRepo: IWalletRepository,
	) {}

	public async sweepSystemFees(): Promise<{
		amountSwept: Prisma.Decimal
		reference: string
	}> {
		pinoLogger.info("Starting system fee settlement sweep...")

		// 1. Find the SYSTEM_FEE wallet
		const feeWallet = await this.walletRepo.findByType("SYSTEM_FEE")
		if (!feeWallet) {
			throw new Error("SYSTEM_FEE wallet not found")
		}

		const amountToSweep = feeWallet.balance
		if (amountToSweep.lte(0)) {
			pinoLogger.info("No funds available to sweep from SYSTEM_FEE wallet.")
			return {
				amountSwept: new Prisma.Decimal(0),
				reference: "NONE",
			}
		}

		// 2. Generate settlement reference
		const reference = generateTransactionReference("SETTLEMENT_SWEEP")

		// 3. Execute atomic transfer from SYSTEM_FEE to SETTLEMENT
		const txReference = await this.transferRepo.executeSettlementSweep(amountToSweep, reference)

		pinoLogger.info(
			{ amountSwept: amountToSweep, reference: txReference },
			"System fee settlement sweep completed successfully.",
		)

		return {
			amountSwept: amountToSweep,
			reference: txReference,
		}
	}
}
