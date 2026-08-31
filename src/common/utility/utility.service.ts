import * as fs from "node:fs"
import * as path from "node:path"
import { inject, injectable } from "inversify"
import juice from "juice"
import { pinoLogger } from "@/config/pino-logger"
import { type IUserRepository, USER_TYPES } from "@/modules/user/user.types"
import type { IUtilityService } from "./utility.type"

@injectable()
export class UtilityService implements IUtilityService {
	private templateCache = new Map<string, string>()
	constructor(
		@inject(USER_TYPES.Repository) private readonly userRepo: IUserRepository,
	) {}

	async generateUniqueUserId5(): Promise<string> {
		let isUnique = false
		let randomUserId5 = ""

		while (!isUnique) {
			// Generate a random number strictly between 10000 and 99999 (always 5 digits, no leading zeros)
			const randomNumber = Math.floor(Math.random() * 90000) + 10000
			randomUserId5 = randomNumber.toString()

			const existing = await this.userRepo.findByUserId5(randomUserId5)
			if (!existing) {
				isUnique = true
			}
		}

		return randomUserId5
	}
	//
	/**
	 * Fetches an image from an external URL (such as Cloudinary) and returns it as a Buffer.
	 */
	async fetchImageBufferFromUrl(imageUrl: string): Promise<Buffer> {
		try {
			const response = await fetch(imageUrl)
			if (!response.ok) {
				throw new Error(
					`Failed to fetch image from URL: ${imageUrl} (Status: ${response.status})`,
				)
			}
			const arrayBuffer = await response.arrayBuffer()
			return Buffer.from(arrayBuffer)
		} catch (error) {
			pinoLogger.error({ error, imageUrl }, "Error fetching image buffer from URL")
			throw error
		}
	}

	/**
	 * Converts a Base64 image string (with or without data prefix) into a Buffer.
	 */
	convertBase64ToBuffer(base64String: string): Buffer {
		const cleanBase64 = base64String.replace(/^data:image\/\w+;base64,/, "")
		return Buffer.from(cleanBase64, "base64")
	}

	/**
	 * Loads, caches, replaces variables, and inlines CSS for any HTML email template.
	 */
	renderEmailTemplate(
		templateFileName: string,
		variables: Record<string, string>,
	): string {
		try {
			// 1. Read from disk once and store in cache map
			if (!this.templateCache.has(templateFileName)) {
				const filePath = path.join(
					__dirname,
					`../../../src/templates/${templateFileName}`,
				)
				const fileContent = fs.readFileSync(filePath, "utf8")
				this.templateCache.set(templateFileName, fileContent)
			}

			let template = this.templateCache.get(templateFileName)

			if (!template) {
				throw new Error(`Template ${templateFileName} could not be loaded.`)
			}

			const mergedVariables = {
				year: new Date().getFullYear().toString(), // Automatically generates current year
				...variables, // User-passed variables can still override if needed
			}

			// 2. Dynamically replace all placeholder tags (e.g. {{name}}, {{otp}}, etc.)
			for (const [key, value] of Object.entries(mergedVariables)) {
				// const regex = new RegExp(`{{${key}}}`, "g");
				const regex = new RegExp(`\\{${key}\\}`, "g")
				template = template.replace(regex, value)
			}

			// 3. Juice parses <style> tags and turns them into inline style attributes
			return juice(template, {
				preserveMediaQueries: true,
			})
		} catch (error) {
			pinoLogger.error({ error, templateFileName }, "Error rendering email template")
			throw error
		}
	}
}
