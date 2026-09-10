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
	executeTransitClaim(phone: string, userId: string, amount: Decimal): Promise<any>
}

export interface IWalletService {
	getBalance(userId: string): Promise<{ balance: Decimal; currency: string }>
	topUp(data: TopUpWalletDto): Promise<any>
}

export const WALLET_TYPES = {
	Service: Symbol.for("WalletService"),
	Repository: Symbol.for("WalletRepository"),
	DevWalletController: Symbol.for("DevWalletController"),
}
