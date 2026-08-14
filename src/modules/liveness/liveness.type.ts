export const LIVENESS_TYPES = {
	Service: Symbol.for("LivenessService"),
}

export interface ILivenessResultResponse {
	score: number
	result: {
		SessionId: string
		Status: "SUCCEEDED" | "EXPIRED" | "CREATED"
		Confidence: number
		ReferenceImage: {
			Bytes: {
				[key: string]: number
			}
			BoundingBox: {
				Width: number
				Height: number
				Left: number
				Top: number
			}
		}
		AuditImages: []
		Challenge: {
			Type: "FaceMovementChallenge"
			Version: "1.0.0"
		}
		$metadata: {
			httpStatusCode: number
			requestId: string
			attempts: number
			totalRetryDelay: number
		}
	}
}

export interface ILiveness {
	initiateLivenessSession(userId: string): Promise<any>
	submitLivenessSessionCapture(
		user: { id: string; phone: string },
		sessionId: string,
	): Promise<any>
}
