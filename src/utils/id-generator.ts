export async function generateUniqueUserId5(prisma: any): Promise<string> {
	let attempts = 0
	const maxAttempts = 10

	while (attempts < maxAttempts) {
		attempts++
		// Generate a random 5-digit number (10000 to 99999)
		const randomId = Math.floor(10000 + Math.random() * 90000).toString()

		const existing = await prisma.user.findUnique({
			where: { userId5: randomId },
		})

		if (!existing) {
			return randomId
		}
	}

	throw new Error("Could not generate a unique 5-digit User ID after 10 attempts")
}
