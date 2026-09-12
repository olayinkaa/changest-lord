import { createSession, type Session } from "better-sse"
import type { Request, Response } from "express"
import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IRedisService } from "@/adapters/redis/redis.types"
import { pinoLogger } from "@/config/pino-logger"
import type { ISseService, SseEvent } from "./sse.types"

@injectable()
export class SseService implements ISseService {
	private readonly sessions = new Map<string, Session[]>()
	private readonly activeSubscriptions = new Set<string>()

	constructor(@inject(ADAPTER_TYPES.RedisService) private readonly redis: IRedisService) {}

	public async handleConnection(req: Request, res: Response, userId: string): Promise<void> {
		try {
			const session = await createSession(req, res, {
				keepAlive: 15000, // Heartbeat every 15s
			})

			const userSessions = this.sessions.get(userId) || []
			userSessions.push(session)
			this.sessions.set(userId, userSessions)

			pinoLogger.info({ userId }, "🔌 SSE connection established")

			const channelName = `user:events:${userId}`

			// Subscribe to Redis once per user if not already active
			if (!this.activeSubscriptions.has(userId)) {
				this.activeSubscriptions.add(userId)

				await this.redis.subscribe(channelName, async (_channel, message) => {
					try {
						const { event, data } = JSON.parse(message)
						const currentSessions = this.sessions.get(userId) || []

						currentSessions.forEach((s) => {
							if (s.isConnected) {
								s.push(data, event)
							}
						})
					} catch (err) {
						pinoLogger.error({ err, message }, "❌ Error processing SSE Redis message")
					}
				})
			}

			session.on("close", () => {
				pinoLogger.info({ userId }, "🔌 SSE connection closed")

				const currentSessions = this.sessions.get(userId)
				if (currentSessions) {
					const filtered = currentSessions.filter((s) => s !== session)
					if (filtered.length === 0) {
						this.sessions.delete(userId)
						this.activeSubscriptions.delete(userId)
						// Safely unsubscribe from Redis channel
						this.redis.unsubscribe(channelName)
					} else {
						this.sessions.set(userId, filtered)
					}
				}
			})
		} catch (err) {
			pinoLogger.error({ err }, "❌ Error creating SSE session")
		}
	}

	public async emitEvent(userId: string, event: SseEvent, data: any): Promise<void> {
		const payload = JSON.stringify({ event, data })
		await this.redis.publish(`user:events:${userId}`, payload)
	}
}
