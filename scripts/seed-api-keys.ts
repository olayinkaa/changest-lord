import "dotenv/config"
import { prisma } from "@/core/database/db"
import { hashApiKey } from "@/utils/crypto"

async function seedApiKeys() {
	const keys = [
		{
			clientName: "INTERNAL_SERVICE",
			rawKey: "my-change-internal-secret-2026",
			allowedIps: ["127.0.0.1", "::1"],
		},
		{
			clientName: "ONBOARDING_PARTNER",
			rawKey: "partner-onboarding-key-xyz-789",
			allowedIps: [], // All IPs allowed for this partner
		},
	]

	console.log("🌱 Seeding System API Keys...")

	for (const key of keys) {
		await prisma.systemApiKey.upsert({
			where: { clientName: key.clientName },
			update: {
				keyHash: hashApiKey(key.rawKey),
				allowedIps: key.allowedIps,
				isActive: true,
			},
			create: {
				clientName: key.clientName,
				keyHash: hashApiKey(key.rawKey),
				allowedIps: key.allowedIps,
				isActive: true,
			},
		})
		console.log(`✅ Seeded key for: ${key.clientName}`)
	}
}

seedApiKeys()
	.then(() => console.log("🚀 API Keys seeded successfully"))
	.catch((e) => {
		console.error("❌ Error seeding API keys:", e)
		process.exit(1)
	})
