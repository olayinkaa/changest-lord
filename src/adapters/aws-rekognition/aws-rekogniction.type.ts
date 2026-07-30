export interface IAwsRekognitionService {
	initiateLivenessSession(token: string): any
	getLivenessSessionResult(sessionId: string): any
}
