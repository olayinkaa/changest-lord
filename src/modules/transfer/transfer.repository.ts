import { injectable } from "inversify"
import { prisma } from "@/core/database/db"
import { type Prisma, TransactionType } from "@/generated/prisma/client"
import { toTitleCase } from "@/utils/helper"
import type { ITransferRepository } from "./transfer.types"

@injectable()
export class TransferRepository implements ITransferRepository {
	public async searchRecipients(query: string) {
		return prisma.user.findFirst({
			where: {
				OR: [{ phone: query }, { userId5: query }],
			},
		})
	}

	public async getUserById(userId: string) {
		return prisma.user.findUnique({
			where: { id: userId },
		})
	}

	public async updateUserSecurity(userId: string, data: { pinAttempts: number; isBlocked: boolean }) {
		return prisma.user.update({
			where: { id: userId },
			data,
		})
	}

	public async executeDoubleEntryTransfer(
		userId: string,
		recipientUserId: string | null,
		amount: Prisma.Decimal,
		fee: Prisma.Decimal,
		reference: string,
		transactionType: TransactionType,
		recipientAccount?: string,
	): Promise<{ reference: string; createdAt: Date }> {
		const totalDebit = amount.add(fee)

		return prisma.$transaction(async (tx) => {
			// 1. Resolve Names for Description
			const senderUser = await tx.user.findUnique({ where: { id: userId } })
			const senderName = senderUser ? `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() : "Unknown"

			let recipientName = recipientAccount || "Bank"
			if (recipientUserId) {
				const recipientUser = await tx.user.findUnique({
					where: { id: recipientUserId },
				})
				if (recipientUser) {
					recipientName = `${recipientUser.firstName || ""} ${recipientUser.lastName || ""}`.trim()
				}
			}

			let headerDescription = ""
			if (transactionType === TransactionType.GIVE_CHANGE) {
				headerDescription = `Give to ${recipientName}`
			} else if (
				transactionType === TransactionType.TRANSFER_MYCHANGE ||
				transactionType === TransactionType.TRANSFER_BANK
			) {
				headerDescription = `Transfer from ${senderName}`
			} else {
				headerDescription = `Transfer ${transactionType} from ${senderName} to ${recipientName}`
			}

			// 2. Create the Transaction Header
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference,
					transactionType,
					recipientAccount: recipientAccount,
					description: headerDescription,
					status: transactionType === TransactionType.TRANSFER_BANK ? "PENDING" : "SUCCESS",
				},
			})

			// 3. Lock and Debit Sender
			const senderWallet = await tx.wallet.findFirst({
				where: { userId },
			})

			if (!senderWallet) throw new Error("Sender wallet not found")
			if (senderWallet.balance.lt(totalDebit)) {
				throw new Error("Insufficient funds to complete the transfer")
			}

			const senderPrevBalance = senderWallet.balance
			const senderNewBalance = senderPrevBalance.sub(totalDebit)

			await tx.wallet.update({
				where: { id: senderWallet.id },
				data: { balance: senderNewBalance },
			})

			// Resolve debit description
			let debitDescription = ""
			if (transactionType === TransactionType.GIVE_CHANGE) {
				debitDescription = `Give to ${recipientName}`
			} else if (
				transactionType === TransactionType.TRANSFER_MYCHANGE ||
				transactionType === TransactionType.TRANSFER_BANK
			) {
				debitDescription = `Transfer to ${recipientName}`
			} else {
				debitDescription = `Debit for ${transactionType}`
			}

			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: senderWallet.id,
					amount: amount.mul(-1),
					type: "DEBIT",
					description: debitDescription,
					previousBalance: senderPrevBalance,
					newBalance: senderNewBalance,
				},
			})

			// Debit Fee ledger entry
			if (fee.gt(0)) {
				await tx.ledger.create({
					data: {
						ledgerTransactionId: ledgerTx.id,
						walletId: senderWallet.id,
						amount: fee.mul(-1),
						type: "DEBIT",
						description: `Transfer fee for ${toTitleCase(transactionType)}`,
						previousBalance: senderPrevBalance, // a fee entry is part of the same balance change event
						newBalance: senderNewBalance,
					},
				})
			}

			// 4. Credit Recipient (or Transit Wallet)
			let recipientWalletId: string
			let userWallet = null

			if (recipientUserId) {
				userWallet = await tx.wallet.findFirst({
					where: { userId: recipientUserId },
				})
			}

			if (userWallet) {
				recipientWalletId = userWallet.id
			} else if (transactionType === TransactionType.TRANSFER_BANK || transactionType === TransactionType.GIVE_CHANGE) {
				const transitWallet = await tx.wallet.findFirst({
					where: { userId: null, type: "TRANSIT", currency: "NGN" },
				})
				if (!transitWallet) throw new Error("Transit wallet not configured")
				recipientWalletId = transitWallet.id
			} else {
				throw new Error("Recipient wallet not found")
			}

			const recipientWallet = await tx.wallet.findUnique({
				where: { id: recipientWalletId },
			})
			if (!recipientWallet) throw new Error("Recipient wallet not found")

			const recipientPrevBalance = recipientWallet.balance
			const recipientNewBalance = recipientPrevBalance.add(amount)

			await tx.wallet.update({
				where: { id: recipientWalletId },
				data: { balance: recipientNewBalance },
			})

			// Resolve credit description
			let creditDescription = ""
			if (transactionType === TransactionType.GIVE_CHANGE) {
				creditDescription = `Gift from ${senderName}`
			} else if (
				transactionType === TransactionType.TRANSFER_MYCHANGE ||
				transactionType === TransactionType.TRANSFER_BANK
			) {
				creditDescription = `Transfer from ${senderName}`
			} else {
				creditDescription = `Credit for ${transactionType}`
			}

			if (!recipientUserId) {
				creditDescription += ` (Pending Claim for ${recipientAccount || "Unknown"})`
			}

			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: recipientWalletId,
					amount: amount,
					type: "CREDIT",
					description: creditDescription,
					previousBalance: recipientPrevBalance,
					newBalance: recipientNewBalance,
				},
			})

			// 5. Credit System Wallet (Fees)
			if (fee.gt(0)) {
				const systemWallet = await tx.wallet.findFirst({
					where: { userId: null, type: "SYSTEM_FEE", currency: "NGN" },
				})
				if (!systemWallet) throw new Error("System wallet not configured")

				const systemPrevBalance = systemWallet.balance
				const systemNewBalance = systemPrevBalance.add(fee)

				await tx.wallet.update({
					where: { id: systemWallet.id },
					data: { balance: systemNewBalance },
				})
				await tx.ledger.create({
					data: {
						ledgerTransactionId: ledgerTx.id,
						walletId: systemWallet.id,
						amount: fee,
						type: "CREDIT",
						description: `System fee collection`,
						previousBalance: systemPrevBalance,
						newBalance: systemNewBalance,
					},
				})
			}

			return {
				reference: ledgerTx.reference,
				createdAt: ledgerTx.createdAt,
			}
		})
	}

	public async executeSettlementSweep(amount: Prisma.Decimal, reference: string): Promise<string> {
		return prisma.$transaction(async (tx) => {
			const ledgerTx = await tx.ledgerTransaction.create({
				data: {
					reference,
					transactionType: TransactionType.SETTLEMENT_SWEEP,
					description: `Settlement sweep of funds from SYSTEM_FEE to SETTLEMENT wallet`,
				},
			})

			const feeWallet = await tx.wallet.findFirst({
				where: { userId: null, type: "SYSTEM_FEE", currency: "NGN" },
			})
			if (!feeWallet) throw new Error("SYSTEM_FEE wallet not configured")

			const feePrevBalance = feeWallet.balance
			const feeNewBalance = feePrevBalance.sub(amount)

			await tx.wallet.update({
				where: { id: feeWallet.id },
				data: { balance: feeNewBalance },
			})
			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: feeWallet.id,
					amount: amount.mul(-1),
					type: "DEBIT",
					description: `Sweep debit: ${reference}`,
					previousBalance: feePrevBalance,
					newBalance: feeNewBalance,
				},
			})

			const settlementWallet = await tx.wallet.findFirst({
				where: { userId: null, type: "SETTLEMENT", currency: "NGN" },
			})
			if (!settlementWallet) throw new Error("SETTLEMENT wallet not configured")

			const settlementPrevBalance = settlementWallet.balance
			const settlementNewBalance = settlementPrevBalance.add(amount)

			await tx.wallet.update({
				where: { id: settlementWallet.id },
				data: { balance: settlementNewBalance },
			})
			await tx.ledger.create({
				data: {
					ledgerTransactionId: ledgerTx.id,
					walletId: settlementWallet.id,
					amount: amount,
					type: "CREDIT",
					description: `Sweep credit: ${reference}`,
					previousBalance: settlementPrevBalance,
					newBalance: settlementNewBalance,
				},
			})

			return ledgerTx.reference
		})
	}

	public async updateTransactionStatus(reference: string, status: any) {
		await prisma.ledgerTransaction.update({
			where: { reference },
			data: { status },
		})
	}

	public async findTransitTransactions2(recipientAccount?: string) {
		return prisma.ledgerTransaction.findMany({
			where: {
				recipientAccount: recipientAccount,
				ledgers: {
					some: {
						claimed: false,
						type: "CREDIT",
					},
				},
			},
			include: {
				ledgers: {
					where: {
						claimed: false,
						type: "CREDIT",
					},
				},
			},
		})
	}

	public async findTransitTransactions(recipientAccount?: string) {
		return prisma.ledgerTransaction.findMany({
			where: {
				recipientAccount: recipientAccount ? recipientAccount : { not: null },
				ledgers: {
					some: {
						claimed: false,
						type: "CREDIT",
						wallet: {
							type: "TRANSIT",
						},
					},
				},
			},
			include: {
				ledgers: {
					include: {
						wallet: true,
					},
					where: {
						claimed: false,
						type: "CREDIT",
						wallet: {
							type: "TRANSIT",
						},
					},
				},
			},
		})
	}
}
