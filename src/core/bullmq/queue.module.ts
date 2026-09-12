import { ContainerModule } from "inversify"
import { QueueService } from "./queue.service"
import { QUEUE_TYPES } from "./queue.types"

export const QueueModule = new ContainerModule((bind) => {
	bind<QueueService>(QUEUE_TYPES.QueueService).to(QueueService)
})
