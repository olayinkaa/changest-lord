import type { Job } from "bullmq"
import { inject, injectable } from "inversify"
import type { IBankAdapter } from "@/adapters/payment/bank.adapter"
import { pinoLogger } from "@/config/pino-logger"
import { BaseProcessor } from "@/core/queue/base.processor"
import { QUEUE_NAMES } from "@/core/queue/queue-name"
import { TransactionStatus } from "@/generated/prisma/enums"
import { type ITransferRepository, TRANSFER_TYPES } from "@/modules/transfer/transfer.types"
import { Prisma } from "@/types/prisma"

export interface BankTransferPayload {
	reference: string
	accountNumber: string
	bankCode: string
	amount: string // Decimal passed as string for JSON safety
}

@injectable()
export class BankTransferWorker extends BaseProcessor {
	public override readonly queueName = QUEUE_NAMES.BankTransfer
	protected override readonly concurrency = 5
	protected override readonly rateLimit = undefined

	constructor(
		@inject(TRANSFER_TYPES.BankAdapter)
		private bankAdapter: IBankAdapter,
		@inject(TRANSFER_TYPES.TransferRepository)
		private transferRepo: ITransferRepository,
	) {
		super()
	}

	protected override async handle(_: any, job: Job<BankTransferPayload>): Promise<void> {
		const { reference, accountNumber, bankCode, amount } = job.data

		pinoLogger.info({ reference, jobId: job.id }, "Processing outbound bank transfer")

		try {
			const decimalAmount = new Prisma.Decimal(amount)

			const result = await this.bankAdapter.transferFunds(accountNumber, bankCode, decimalAmount, reference)

			if (result.status === "SUCCESS") {
				pinoLogger.info({ reference }, "Outbound bank transfer completed successfully")
				await this.transferRepo.updateTransactionStatus(reference, TransactionStatus.SUCCESS)
			} else {
				pinoLogger.error({ error: result.errorMessage, reference }, "Outbound bank transfer failed via adapter")
				await this.transferRepo.updateTransactionStatus(reference, TransactionStatus.PARTIAL_SUCCESS)
			}
		} catch (error: any) {
			pinoLogger.error({ error, reference, jobId: job.id }, "Bank transfer worker encountered an error")
			throw error
		}
	}
}
