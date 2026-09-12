import { ContainerModule } from "inversify"
import { PaymentController } from "./payment.controller"
import { PaymentRepository } from "./payment.repository"
import { PaymentService } from "./payment.service"
import { type IPaymentRepository, type IPaymentService, PAYMENT_TYPES } from "./payment.type"

export const PaymentModule = new ContainerModule((bind) => {
	bind(PaymentController).toSelf()
	bind<IPaymentRepository>(PAYMENT_TYPES.Repository).to(PaymentRepository)
	bind<IPaymentService>(PAYMENT_TYPES.Service).to(PaymentService)
})
