export interface IAwsRekognitionService {
	initiateLivenessSession(token: string): any
	getLivenessSessionResult(sessionId: string): any
	addFaceToCollection(collectionId: string, imageBuffer: Buffer, identifier: string): any
	deleteFacesFromCollection(collectionId: string, faceIds: string[]): Promise<string[]>
	searchFaceInCollection(targetImageBuffer: Buffer, collectionId: string): any
	deleteCollection(collectionId: string): any
	ensureCollectionExists(collectionId: string): any
	listCollections(): Promise<string[]>
	describeCollectionDetails(collectionId: string): any
	listFacesInCollection(collectionId: string): any
}
