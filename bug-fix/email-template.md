```ts
renderEmailTemplate(templateFileName: string, variables: Record<string, string>): string {
		try {
			// 1. Read from disk once and store in cache map
			if (!this.templateCache.has(templateFileName)) {
				const filePath = path.join(__dirname, `../../../src/templates/${templateFileName}`)
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

```