import type { Prisma, WalletType } from "@/generated/prisma/client"
import type { TopUpWalletDto } from "./wallet.dto"

export type Decimal = Prisma.Decimal

export interface IWalletRepository {
	findByUserId(userId: string): Promise<any | null>
	updateBalance(walletId: string, amount: Decimal, mode: "ADD" | "SUBTRACT"): Promise<any>
	createWallet(userId: string): Promise<any>
	findById(walletId: string): Promise<any | null>
	findByType(type: WalletType): Promise<any | null>
	topUp(userId: string, amount: Decimal): Promise<any>
	executeTransitClaim(phone: string, userId: string, amount: Decimal, ledgerId: string): Promise<any>
	deleteByUserId(userId: string): Promise<void>
}

export interface TransactionDetailDto {
	id: string
	title: string
	amount: string
	type: "in" | "out"
	date: string
	time: string
	status: string
	isFee: boolean
}

export interface TransactionSectionDto {
	month: string
	totalIn: string
	totalOut: string
	totalFees: string
	totalOutWithFees: string
	data: TransactionDetailDto[]
}

export interface TransactionListResponseDto {
	sections: TransactionSectionDto[]
}

export interface IWalletService {
	getBalance(userId: string): Promise<{ balance: Decimal; currency: string }>
	topUp(data: TopUpWalletDto): Promise<any>
	getTransactionHistory(userId: string): Promise<TransactionListResponseDto>
	createWalletForUser(userId: string): Promise<any>
	getRecentTransactions(userId: string, limit: number): Promise<any[]>
}

export const WALLET_TYPES = {
	Service: Symbol.for("WalletService"),
	Repository: Symbol.for("WalletRepository"),
	DevWalletController: Symbol.for("DevWalletController"),
}
