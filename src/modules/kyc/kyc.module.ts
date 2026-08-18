import { ContainerModule } from "inversify"
import { KycController } from "./kyc.controller"
import { KycRepository } from "./kyc.repository"
import { KycService } from "./kyc.service"
import { type IKycRepository, type IKycService, KYC_TYPES } from "./kyc.types"

export const KycModule = new ContainerModule((bind) => {
	bind<IKycService>(KYC_TYPES.Service).to(KycService)
	bind(KycController).toSelf()
	bind<IKycRepository>(KYC_TYPES.Repository).to(KycRepository)
})
