import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"
import { seedSystemWallets } from "./system.seed"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

async function main() {
	try {
		await seedSystemWallets(prisma)
		console.log("✅ System seed completed successfully!")
	} catch (error) {
		console.error("❌ System seed failed:", error)
		process.exit(1)
	}
}

main().finally(async () => {
	await prisma.$disconnect()
})
