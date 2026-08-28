import { ContainerModule } from "inversify"
import { QueueService } from "./queue.service"
import { TYPES } from "./queue.types"

export const QueueModule = new ContainerModule((bind) => {
	bind(TYPES.QueueService).to(QueueService)
})
