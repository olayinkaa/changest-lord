import { ContainerModule } from "inversify"
import { OnboardingController } from "./onboarding.controller"
import { OnboardingService } from "./onboarding.service"
import { type IOnboardingService, ONBOARDING_TYPES } from "./onboarding.type"

export const OnboardingModule = new ContainerModule((bind) => {
	bind<IOnboardingService>(ONBOARDING_TYPES.Service).to(OnboardingService)
	bind(OnboardingController).toSelf()
})
