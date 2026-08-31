import { inject, injectable } from "inversify"
import { ADAPTER_TYPES } from "@/adapters/adapters.types"
import type { IAwsSesService, ISendEmailOptions } from "@/adapters/aws-ses/aws-ses.types"
import type { IEmailSender } from "./email.types"

@injectable()
export class SesEmailSender implements IEmailSender {
	constructor(
		@inject(ADAPTER_TYPES.AwsSesService) private readonly ses: IAwsSesService,
	) {}

	send(options: ISendEmailOptions) {
		return this.ses.sendEmail(options)
	}
}
