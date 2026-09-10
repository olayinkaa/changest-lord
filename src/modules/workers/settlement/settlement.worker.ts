import type { Job } from "bullmq"
import { inject, injectable } from "inversify"
import { pinoLogger } from "@/config/pino-logger"
import { BaseProcessor } from "@/core/queue/base.processor"
import { QUEUE_NAMES } from "@/core/queue/queue-name"
import type { ISettlementService } from "@/modules/settlement/settlement.service"
import { SETTLEMENT_TYPES } from "@/modules/settlement/settlement.types"

@injectable()
export class SettlementWorker extends BaseProcessor {
	public override readonly queueName = QUEUE_NAMES.Settlement
	protected override readonly concurrency = 1
	protected override readonly rateLimit = undefined

	constructor(
		@inject(SETTLEMENT_TYPES.SettlementService)
		private settlementService: ISettlementService,
	) {
		super()
	}

	protected override async handle(_: any, job: Job<any>): Promise<void> {
		pinoLogger.info({ jobId: job.id }, "Processing settlement sweep job")
		try {
			const result = await this.settlementService.sweepSystemFees()
			pinoLogger.info({ result }, "Settlement sweep job completed successfully")
		} catch (error: any) {
			pinoLogger.error({ error, jobId: job.id }, "Settlement sweep job failed")
			throw error
		}
	}
}
