import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IVerificationService } from "@/adapters/verification/verification.types"
import { BadRequestException } from "@/core/errors/exceptions"
import { ErrorType } from "@/types/enum"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import { type IKycRepository, type IKycService, KYC_TYPES } from "./kyc.types"

@injectable()
export class KycService implements IKycService {
	constructor(
		@inject(ADAPTER_TYPES.VerificationService)
		private verificationService: IVerificationService,
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
		@inject(KYC_TYPES.Repository) private readonly kycRepo: IKycRepository,
	) {}

	async validateBvn(bvn: string): Promise<any> {
		// Step 1: Check if BVN belongs to an existing user in your system
		const existingUser = await this.userRepo.findByBvn(bvn)
		if (existingUser) {
			throw new BadRequestException(
				"This BVN belongs to an existing user. Please login or enter a new BVN",
				{
					errorType: ErrorType.BVN_ALREADY_EXISTS,
				},
			)
		}
		// Step 2: Check if BVN is already saved locally (cache check to save cost)
		const cachedBvn = await this.kycRepo.findBvnRecordLocally(bvn)
		if (cachedBvn) {
			return cachedBvn // Returns instantly without calling Dojah!
		}

		// Step 3: If not found locally, call Dojah to validate
		const result = await this.verificationService.verifyBVN(bvn)

		// Step 4: Do face comparison

		// Step 5: Save information locally
		const savedCache = await this.kycRepo.saveBvnRecordLocally({
			bvn: bvn,
			firstName: result.first_name,
			lastName: result.last_name,
			dob: result.date_of_birth,
			phone: result.phone,
			image: result.image,
		})

		// Step 6: update user table: bvn, bvnVerified, faceComparison

		return savedCache
	}
}
