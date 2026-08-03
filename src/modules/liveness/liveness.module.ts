import { ContainerModule } from "inversify"
import { LivenessService } from "./liveness.service"
import { type ILiveness, LIVENESS_TYPES } from "./liveness.type"

export const LivenessModule = new ContainerModule((bind) => {
	bind<ILiveness>(LIVENESS_TYPES.Service).to(LivenessService)
})
