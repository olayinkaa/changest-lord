import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

// Create a new Driver Adapter instance for PrismaPostgres
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

const userData = [
	{
		email: "ibrahimolayinkaa@gmail.com",
		phone: "+2347065643303",
		firstName: "Olayinka",
		lastName: "Ibrahim",
	},
]

export async function main() {
	for (const u of userData) {
		await prisma.user.create({
			data: u,
		})
	}
}

main()
