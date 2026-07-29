import type { Env } from "@/config/env"

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Env {}
	}
}
