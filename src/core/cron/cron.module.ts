import { ContainerModule } from "inversify"
import { CronService } from "./cron.service"

export const CronModule = new ContainerModule((bind) => {
	bind(CronService).toSelf().inSingletonScope()
})
