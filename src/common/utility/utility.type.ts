export const UTILITY_TYPES = {
	Service: Symbol.for("UtilityService"),
}

export type IUtilityService = {
	generateUniqueUserId5(): Promise<string>
	fetchImageBufferFromUrl(imageUrl: string): Promise<Buffer>
	convertBase64ToBuffer(base64String: string): Buffer
}
