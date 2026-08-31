export const UTILITY_TYPES = {
	Service: Symbol.for("UtilityService"),
}

export interface IUtilityService {
	generateUniqueUserId5(): Promise<string>
	fetchImageBufferFromUrl(imageUrl: string): Promise<Buffer>
	convertBase64ToBuffer(base64String: string): Buffer
	renderEmailTemplate(templateFileName: string, variables: Record<string, string>): string
}
