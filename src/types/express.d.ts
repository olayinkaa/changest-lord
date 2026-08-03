// biome-ignore lint/correctness/noUnusedImports: false positive
import * as express from "express"

declare global {
	namespace Express {
		interface Request {
			onboardingUser?: IOnboardingUser
		}
	}
}
