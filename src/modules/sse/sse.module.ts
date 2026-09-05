import { ContainerModule } from "inversify"
import { SseController } from "./sse.controller"
import { SseService } from "./sse.service"
import { SSE_TYPES } from "./sse.types"

export const SseModule = new ContainerModule((bind) => {
	bind(SSE_TYPES.Service).to(SseService).inSingletonScope()
	bind(SSE_TYPES.Controller).to(SseController)
})
