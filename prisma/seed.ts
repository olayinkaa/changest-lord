import { faker } from "@faker-js/faker"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

// Create a new Driver Adapter instance for PrismaPostgres
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

function generateNigerianPhone(): string {
	const prefixes = [
		"803",
		"806",
		"813",
		"816",
		"703",
		"706",
		"903",
		"906",
		"805",
		"807",
		"811",
		"815",
		"905",
		"802",
		"809",
		"812",
		"902",
		"909",
		"817",
		"818",
		"908",
		"701",
		"708",
	]
	const randomPrefix = faker.helpers.arrayElement(prefixes)
	const remainingDigits = faker.string.numeric(7) // Generates 7 random digits
	return `+234${randomPrefix}${remainingDigits}`
}

const userData = Array.from({ length: 10 }).map(() => {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	return {
		firstName,
		lastName,
		email: faker.internet.email({ firstName, lastName }).toLowerCase(),
		phone: generateNigerianPhone(),
	}
})

async function main() {
	for (const u of userData) {
		await prisma.user.create({
			data: u,
		})
	}
}

main()
