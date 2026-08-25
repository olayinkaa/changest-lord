import { ContainerModule } from "inversify"
import { bvnRepository } from "./bvn.repository"
import { BvnService } from "./bvn.service"
import { BVN_TYPES, type IBvnRepository, type IBvnService } from "./bvn.types"

export const BvnModule = new ContainerModule((bind) => {
	bind<IBvnService>(BVN_TYPES.Service).to(BvnService)
	bind<IBvnRepository>(BVN_TYPES.Repository).to(bvnRepository)
})
