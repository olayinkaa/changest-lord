export interface IAwsRekognitionService {
	initiateLivenessSession(token: string): any
	getLivenessSessionResult(sessionId: string): any
	addFaceToCollection(collectionId: string, imageBuffer: Buffer, identifier: string): any
	searchFaceInCollection(targetImageBuffer: Buffer, collectionId: string): any
}
