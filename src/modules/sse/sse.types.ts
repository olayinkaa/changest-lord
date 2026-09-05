import type { Request, Response } from "express"

export enum SseEvent {
	EmailSent = "EMAIL_SENT",
	TransactionReceived = "TRANSACTION_RECEIVED",
	KycUpdated = "KYC_UPDATED",
	SystemAlert = "SYSTEM_ALERT",
}

export const SSE_TYPES = {
	Service: Symbol.for("SseService"),
	Controller: Symbol.for("SseController"),
} as const

export interface ISseService {
	handleConnection(req: Request, res: Response, userId: string): Promise<void>
	emitEvent(userId: string, event: SseEvent, data: any): Promise<void>
}
