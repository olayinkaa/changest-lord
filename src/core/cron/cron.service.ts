import { injectable } from "inversify"
import * as cron from "node-cron"
import { pinoLogger } from "@/config/pino-logger"

@injectable()
export class CronService {
	private jobs: Map<string, cron.ScheduledTask> = new Map()

	public schedule(name: string, cronExpression: string, task: () => Promise<void>) {
		if (this.jobs.has(name)) {
			pinoLogger.warn({ name }, "Cron job already exists, skipping schedule")
			return
		}

		const job = cron.schedule(cronExpression, async () => {
			try {
				pinoLogger.info({ name }, "Executing scheduled cron task")
				await task()
			} catch (error: any) {
				pinoLogger.error({ name, error }, "Scheduled cron task failed")
			}
		})

		this.jobs.set(name, job)
		pinoLogger.info({ name, cronExpression }, "Scheduled cron task successfully")
	}

	public stopAll() {
		for (const [name, job] of this.jobs) {
			job.stop()
			pinoLogger.info({ name }, "Stopped cron task")
		}
		this.jobs.clear()
	}
}
