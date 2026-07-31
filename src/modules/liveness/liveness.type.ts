import type { InitiateLivenessRequest } from "./liveness.dto"

export const LIVENESS_TYPES = {
	Service: Symbol.for("LivenessService"),
}

export interface ILiveness {
	initiateLivenessSession(data: InitiateLivenessRequest): Promise<any>
	getLivenessSessionResult(sessionId: string): Promise<any>
}
