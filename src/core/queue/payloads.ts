/**
 * This file contains all the data shapes (payloads) for background jobs.
 * Adding a new payload here keeps the main queue.types.ts clean.
 */

export type EmailJobPayload = {
	to: string
	subject: string
	htmlBody?: string
	textBody?: string
	fromEmail?: string
}

export type CloudinaryJobPayload = {
	fileUrl: string
	folder: string
	publicId?: string
}

// Add more payloads here as needed
// export type PaymentJobPayload = { ... }
