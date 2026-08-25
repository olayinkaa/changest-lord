import type { IDojahBvnFullResponse, IDojahNinResponse } from "./dojah/dojah.types"
import type {
	YouVerifyBvnResponse,
	YouVerifyNinResponse,
} from "./you-verify/youverify.type"

export type VerificationProviderType = "dojah" | "youverify"

// Discriminated Union for BVN Verification
export type BvnVerificationResult = IDojahBvnFullResponse | YouVerifyBvnResponse

// Discriminated Union for NIN Verification
export type NinVerificationResult = IDojahNinResponse | YouVerifyNinResponse

export interface IVerificationService {
	readonly providerName: string
	verifyNIN(nin: string): Promise<NinVerificationResult>
	verifyBVN(bvn: string): Promise<BvnVerificationResult>
	// verifyBasicPhone(_phoneNumber: string): Promise<any>
}
