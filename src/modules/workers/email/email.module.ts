import { ContainerModule } from "inversify"
import { EmailProducer } from "./email.producer"
import { EMAIL_TYPES, type IEmailProducer, type IEmailSender } from "./email.types"
import { SesEmailSender } from "./ses-email.sender"

export const EmailModule = new ContainerModule((bind) => {
	bind<IEmailSender>(EMAIL_TYPES.EmailSender).to(SesEmailSender)
	bind<IEmailProducer>(EMAIL_TYPES.Producer).to(EmailProducer)
})
