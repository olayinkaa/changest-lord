import "reflect-metadata";
import { Container } from "inversify";
import { InversifyExpressHttpAdapter } from "@inversifyjs/http-express";
import { Application } from "./utils/application";
import AppModules from "./app.module";
import { Server } from "node:http";
import { config } from "@/config";
import { type Application as ExpressApplication } from "express";

export class App extends Application {
  private httpServer!: Server;

  configureService(container: Container): void {
    container.load(...AppModules);
  }

  async setup() {
    const adapter = new InversifyExpressHttpAdapter(this.container, {
      logger: true,
      useCookies: false,
      useJson: true,
      useUrlEncoded: true,
    });

    const app: ExpressApplication = await adapter.build();
    this.httpServer = app.listen(config.SERVICE_PORT, () => {
      console.log(
        `🛜 ${config.SERVICE_NAME} is running on http://localhost:${config.SERVICE_PORT}`,
      );
    });
    //
    this.httpServer.timeout = 35_000;
    // ─── Graceful shutdown ───────────────────────────────────
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, shutting down...");
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received, shutting down...");
      process.exit(0);
    });
  }
}

async function bootstrap() {
  new App({ defaultScope: "Singleton" });
}

bootstrap();
