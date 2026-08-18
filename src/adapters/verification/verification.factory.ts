import type { interfaces } from "inversify"
import { config } from "@/config/env"
import { DojaService } from "./dojah/dojah.service"
import type { IVerificationService } from "./verification.types"
import { YouVerifyService } from "./you-verify/youverify.service"

export const VerificationFactory = (
	_context: interfaces.Context,
): IVerificationService => {
	const provider = config.VERIFCATION_PROVIDER
	switch (provider) {
		case "dojah":
			return new DojaService()
		case "youverify":
			return new YouVerifyService()
		default:
			throw new Error(`Unsupported VERIFICATIOn_PROVIDER: ${provider}`)
	}
}
