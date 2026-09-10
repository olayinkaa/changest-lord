import type { PrismaClient } from "../../src/generated/prisma/client"

export async function seedConfigs(prisma: PrismaClient) {
	console.log("Seeding business types...")
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

	for (const bt of businessTypesData) {
		await prisma.businessType.upsert({
			where: { type: bt.type },
			update: {},
			create: bt,
		})
	}
}
