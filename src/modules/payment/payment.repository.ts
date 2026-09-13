import { injectable } from "inversify"
import type { IStaticVirtualAccountResponse } from "@/adapters/payment/brails/brails.type"
import { prisma } from "@/core/database/db"
import type { IPaymentRepository } from "./payment.type"

@injectable()
export class PaymentRepository implements IPaymentRepository {
	async updateUserAccountDetail(userId: string, brailsResponse: IStaticVirtualAccountResponse) {
		const accountData = brailsResponse.data

		return prisma.$transaction(async (tx) => {
			// Update quick reference field on the User model
			await tx.user.update({
				where: { id: userId },
				data: {
					virtualAccountNo: accountData.accountNumber,
				},
			})

			// 2. Upsert the detailed record in the VirtualDepositAccount relational table
			return tx.virtualDepositAccount.upsert({
				where: { userId },
				update: {
					accountName: accountData.accountName,
					accountNumber: accountData.accountNumber,
					bankName: accountData.bankName,
					currency: accountData.currency?.toUpperCase() || "NGN",
					reference: accountData.reference,
				},
				create: {
					userId,
					accountName: accountData.accountName,
					accountNumber: accountData.accountNumber,
					bankName: accountData.bankName,
					currency: accountData.currency?.toUpperCase() || "NGN",
					reference: accountData.reference,
				},
			})
		})
	}

	async findByUserId(userId: string) {
		return prisma.virtualDepositAccount.findUnique({
			where: { userId },
		})
	}
}
