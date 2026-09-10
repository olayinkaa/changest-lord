import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { seedConfigs } from "./seeds/config.seed"
import { seedSystemWallets } from "./seeds/system.seed"
import { seedUsers } from "./seeds/users.seed"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

async function main() {
	console.log("🚀 Starting Master Seed Orchestrator...")

	try {
		// Order of execution is critical
		await seedConfigs(prisma)
		await seedSystemWallets(prisma)
		await seedUsers(prisma)

		console.log("✅ Database seeding completed successfully!")
	} catch (error) {
		console.error("❌ Seeding error occurred:", error)
		process.exit(1)
	}
}

main().finally(async () => {
	await prisma.$disconnect()
})
