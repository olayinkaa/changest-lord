import { injectable } from "inversify"
import * as cron from "node-cron"
import { pinoLogger } from "@/config/pino-logger"

export interface CronJobConfig {
	name: string
	expression: string
	task: () => Promise<void>
	overlap?: boolean
}

@injectable()
export class CronService {
	private jobs: Map<string, { task: cron.ScheduledTask; isRunning: boolean }> = new Map()

	public schedule(config: CronJobConfig) {
		const { name, expression, task, overlap = false } = config

		// 1. Guard clause for validation
		if (!cron.validate(expression)) {
			pinoLogger.error({ name, expression }, "Invalid cron expression provided. Skipping.")
			return
		}

		if (this.jobs.has(name)) {
			pinoLogger.warn({ name }, "Cron job already exists, skipping schedule")
			return
		}

		const job = cron.schedule(expression, async () => {
			// Fetch the live state reference directly from the map at execution time
			const currentJobState = this.jobs.get(name)
			if (!currentJobState) return

			if (!overlap && currentJobState.isRunning) {
				pinoLogger.warn(
					{ name },
					"Cron job is still running from previous execution; skipping this run to prevent overlap",
				)
				return
			}

			try {
				currentJobState.isRunning = true
				pinoLogger.info({ name }, "Executing scheduled cron task")
				await task()
			} catch (error: any) {
				pinoLogger.error({ name, error: error?.message || error }, "Scheduled cron task failed")
			} finally {
				// 2. Defensive check: only clear running state if the job wasn't removed mid-execution
				const postRunState = this.jobs.get(name)
				if (postRunState) {
					postRunState.isRunning = false
				}
			}
		})

		this.jobs.set(name, { task: job, isRunning: false })
		pinoLogger.info({ name, expression }, "Scheduled cron task successfully")
	}

	public stopJob(name: string): boolean {
		const jobState = this.jobs.get(name)
		if (!jobState) {
			pinoLogger.warn({ name }, "Attempted to stop a non-existent cron task")
			return false
		}

		jobState.task.stop()
		this.jobs.delete(name)
		pinoLogger.info({ name }, "Stopped and removed cron task")
		return true
	}

	public stopAll() {
		pinoLogger.info("Stopping all scheduled cron tasks...")
		for (const [name, state] of this.jobs) {
			state.task.stop()
			pinoLogger.info({ name }, "Stopped cron task")
		}
		this.jobs.clear()
	}
}
