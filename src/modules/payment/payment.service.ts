import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IBrailsService } from "@/adapters/payment/brails/brails.type"
import { pinoLogger } from "@/config/pino-logger"
import { BadRequestException, NotFoundException } from "@/core/errors/exceptions"
import { generateTransactionReference } from "@/utils/reference-generator"
import { type IUserRepository, USER_TYPES } from "../user/user.types"
import { type IPaymentRepository, type IPaymentService, PAYMENT_TYPES } from "./payment.type"

@injectable()
export class PaymentService implements IPaymentService {
	constructor(
		@inject(ADAPTER_TYPES.BrailsService)
		private readonly brailsService: IBrailsService,
		@inject(PAYMENT_TYPES.Repository)
		private readonly paymentRepo: IPaymentRepository,
		@inject(USER_TYPES.Repository)
		private readonly userRepo: IUserRepository,
	) {}

	async createUserVirtualAccount(userId: string, bvn: string) {
		const user = await this.userRepo.findUser(userId)
		if (!user) {
			throw new NotFoundException("User not found")
		}

		if (!user?.firstName || !user?.lastName || !user.email) {
			throw new BadRequestException("Account creation failed: Missing required fields")
		}

		const reference = generateTransactionReference("GENERAL")
		const payload = {
			firstName: user.firstName,
			lastName: user.lastName,
			customerEmail: user.email,
			phoneNumber: user.phone,
			reference,
			bvn,
		}

		const result = await this.brailsService.createStaticVirtualAccount(payload)

		try {
			// Pass userId along with the API result to the repository
			const res = await this.paymentRepo.updateUserAccountDetail(userId, result)
			pinoLogger.info({ ressp: res })
			return res
		} catch (error: any) {
			// Handle Prisma Unique Constraint Violation (e.g., duplicate account number or BVN)
			if (error.code === "P2002") {
				const target = error.meta?.target
				if (target?.includes("virtualAccountNo") || target?.includes("accountNumber")) {
					throw new BadRequestException("This virtual account number is already assigned. Please try again.")
				}
				if (target?.includes("bvn")) {
					throw new BadRequestException("This BVN is already linked to another account.")
				}
				throw new BadRequestException("A record with this unique detail already exists.")
			}
			// Re-throw any other unexpected errors so they bubble up to global error handler
			throw error
		}
	}
}
