import { ContainerModule } from "inversify"
import { OnboardingController } from "./onboarding.controller"
import { OnboardingRepository } from "./onboarding.repository"
import { OnboardingService } from "./onboarding.service"
import { ONBOARDING_TYPES } from "./onboarding.types"

export const OnboardingModule = new ContainerModule((bind) => {
	bind<OnboardingRepository>(ONBOARDING_TYPES.Repository).to(OnboardingRepository)
	bind<OnboardingService>(ONBOARDING_TYPES.Service).to(OnboardingService)
	bind<OnboardingController>(ONBOARDING_TYPES.Controller).to(OnboardingController)
})
