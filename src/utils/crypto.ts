import crypto from "node:crypto"

/**
 * Hashes an API key using SHA-256.
 * Used to store keys securely in the database.
 */
export const hashApiKey = (key: string): string => {
	return crypto.createHash("sha256").update(key).digest("hex")
}
