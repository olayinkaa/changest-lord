import { type PrismaClient, WalletType } from "../../src/generated/prisma/client"

export async function seedSystemWallets(prisma: PrismaClient) {
	console.log("Seeding system wallets...")
	const systemWalletTypes = [WalletType.SYSTEM_FEE, WalletType.TRANSIT]

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
				},
			})
		}
	}
}
