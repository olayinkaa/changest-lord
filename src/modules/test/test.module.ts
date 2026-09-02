import { ContainerModule } from "inversify"
import { TestController } from "./test.controller"
import { TestService } from "./test.service"
import { type ITestService, TEST_TYPES } from "./test.type"

export const TestModule = new ContainerModule((bind) => {
	bind<ITestService>(TEST_TYPES.Service).to(TestService)
	bind(TestController).toSelf()
})
