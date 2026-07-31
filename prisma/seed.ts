import { faker } from "@faker-js/faker"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

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
	const remainingDigits = faker.string.numeric(7)
	return `+234${randomPrefix}${remainingDigits}`
}

async function main() {
	console.log("Starting database seeding...")

	// 1. Seed Business Types
	const businessTypesData = [
		{ type: "Retail", description: "General retail stores and shops" },
		{ type: "Hospitality", description: "Hotels, restaurants, and cafes" },
		{
			type: "Professional Services",
			description: "Consultants, lawyers, and accountants",
		},
		{ type: "Health", description: "Clinics, pharmacies, and hospitals" },
		{ type: "Technology", description: "Software development and IT services" },
		{ type: "Agriculture", description: "Farming and agro-allied services" },
		{ type: "Education", description: "Schools, training centers, and tutors" },
		{ type: "Logistics", description: "Courier and transport services" },
	]

	console.log("Seeding business types...")
	const createdBusinessTypes = []
	for (const bt of businessTypesData) {
		const created = await prisma.businessType.upsert({
			where: { type: bt.type },
			update: {},
			create: bt,
		})
		createdBusinessTypes.push(created)
	}

	// 2. Seed Users
	console.log("Seeding users...")
	const users = []
	for (let i = 0; i < 20; i++) {
		const firstName = faker.person.firstName()
		const lastName = faker.person.lastName()
		const businessType = faker.helpers.arrayElement(createdBusinessTypes)

		const user = await prisma.user.create({
			data: {
				firstName,
				lastName,
				email: faker.internet.email({ firstName, lastName }).toLowerCase(),
				phone: generateNigerianPhone(),
				businessTypeId: businessType.id,
				userType: faker.helpers.arrayElement(["customer", "seller"]),
			},
		})
		users.push(user)
	}

	// 3. Seed KYC
	console.log("Seeding KYC records...")
	for (let i = 0; i < users.length; i++) {
		const user = users[i]
		// Ensure at least the first user has completedProfile: true
		const completedProfile = i === 0 || faker.datatype.boolean({ probability: 0.2 })

		await prisma.userKyc.create({
			data: {
				userId: user.id,
				livenessDone: completedProfile,
				completedProfile: completedProfile,
				emailVerified: faker.datatype.boolean(),
				phoneVerified: faker.datatype.boolean(),
				ninVerified: faker.datatype.boolean(),
				locationVerified: faker.datatype.boolean(),
				whatsappVerified: faker.datatype.boolean(),
				createdPin: completedProfile,
			},
		})
	}

	console.log("Database seeding completed successfully!")
}

main()
	.catch((e) => {
		console.error("Seeding error:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
