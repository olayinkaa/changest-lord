import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"
import { seedConfigs } from "./config.seed"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

async function main() {
	try {
		await seedConfigs(prisma)
		console.log("✅ Config seed completed successfully!")
	} catch (error) {
		console.error("❌ Config seed failed:", error)
		process.exit(1)
	}
}

main().finally(async () => {
	await prisma.$disconnect()
})
