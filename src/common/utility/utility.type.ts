export const UTILITY_TYPES = {
	Service: Symbol.for("UtilityService"),
}

export type IUtilityService = {
	generateUniqueUserId5(): Promise<string>
}
