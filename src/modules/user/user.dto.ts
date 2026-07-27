import { z } from "zod"

export const userSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().min(1, "Email is required"),
})

export type userInputs = z.infer<typeof userSchema>
