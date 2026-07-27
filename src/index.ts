import "reflect-metadata"
import type { Server } from "node:http"
import { InversifyExpressHttpAdapter } from "@inversifyjs/http-express"
import { InversifyValidationErrorFilter } from "@inversifyjs/http-validation"
import { StandardSchemaValidationPipe } from "@inversifyjs/standard-schema-validation"
import type { Application as ExpressApplication } from "express"
import type { Container } from "inversify"
import { config } from "@/config"
import AppModules from "./app.module"
import { Application } from "./utils/application"
// import { ZodValidationErrorFilter } from "@/core/errors/zod-validation-error.filter";
// import { ClassValidationPipe } from "@inversifyjs/class-validation";

export class App extends Application {
	private httpServer!: Server

	configureService(container: Container): void {
		container.load(...AppModules)
		container.bind(InversifyValidationErrorFilter).toSelf().inSingletonScope()
		// container.bind(ZodValidationErrorFilter).toSelf().inSingletonScope()
	}

	async setup() {
		const adapter = new InversifyExpressHttpAdapter(this.container, {
			logger: true,
			useCookies: false,
			useJson: true,
			useUrlEncoded: true,
		})

		adapter.useGlobalFilters(InversifyValidationErrorFilter)
		adapter.useGlobalPipe(new StandardSchemaValidationPipe())
		// adapter.useGlobalPipe(new ClassValidationPipe());
		// adapter.useGlobalFilters(ZodValidationErrorFilter);

		const app: ExpressApplication = await adapter.build()
		this.httpServer = app.listen(config.SERVICE_PORT, () => {
			console.log(
				`🛜 ${config.SERVICE_NAME} is running on http://localhost:${config.SERVICE_PORT}`,
			)
		})

		//
		this.httpServer.timeout = 35_000
		// ─── Graceful shutdown ───────────────────────────────────
		process.on("SIGTERM", async () => {
			console.log("SIGTERM received, shutting down...")
			process.exit(0)
		})

		process.on("SIGINT", async () => {
			console.log("SIGINT received, shutting down...")
			process.exit(0)
		})
	}
}

async function bootstrap() {
	new App({ defaultScope: "Singleton" })
}

bootstrap()
