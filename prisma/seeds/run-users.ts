import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"
import { seedUsers } from "./users.seed"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

async function main() {
	try {
		await seedUsers(prisma)
		console.log("✅ Users seed completed successfully!")
	} catch (error) {
		console.error("❌ Users seed failed:", error)
		process.exit(1)
	}
}

main().finally(async () => {
	await prisma.$disconnect()
})
