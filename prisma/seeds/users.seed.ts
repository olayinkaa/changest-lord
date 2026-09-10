import { faker } from "@faker-js/faker"
import type { PrismaClient } from "../../src/generated/prisma/client"

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

export async function seedUsers(prisma: PrismaClient) {
	console.log("Seeding users, KYC and wallets...")

	const businessTypes = await prisma.businessType.findMany()
	if (businessTypes.length === 0) {
		throw new Error("Business types must be seeded before users.")
	}

	const users = []
	for (let i = 0; i < 20; i++) {
		const firstName = faker.person.firstName()
		const lastName = faker.person.lastName()
		const businessType = faker.helpers.arrayElement(businessTypes)

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

	for (let i = 0; i < users.length; i++) {
		const user = users[i]
		const completedProfile = i === 0 || faker.datatype.boolean({ probability: 0.2 })

		// Seed KYC
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
				pinCreated: completedProfile,
			},
		})

		// Seed User Wallet
		await prisma.wallet.create({
			data: {
				userId: user.id,
				type: "USER",
				currency: "NGN",
			},
		})
	}
}
