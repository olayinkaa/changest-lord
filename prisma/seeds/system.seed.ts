import { type PrismaClient, WalletType } from "../../src/generated/prisma/client"
import { Prisma } from "../../src/types/prisma"

export async function seedSystemWallets(prisma: PrismaClient) {
	console.log("Seeding system wallets...")
	const systemWalletTypes = [WalletType.SYSTEM_FEE, WalletType.TRANSIT, WalletType.SETTLEMENT]

	for (const type of systemWalletTypes) {
		const exists = await prisma.wallet.findFirst({
			where: { type, userId: null },
		})
		if (!exists) {
			await prisma.wallet.create({
				data: {
					type,
					userId: null,
					currency: "NGN",
					balance: new Prisma.Decimal(0),
				},
			})
			console.log(`✅ Created ${type} wallet`)
		} else {
			console.log(`ℹ️ ${type} wallet already configured`)
		}
	}
}
