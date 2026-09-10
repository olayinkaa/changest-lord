import { BaseHttpController, controller } from "inversify-express-utils"

@controller("/webhook")
export class UserController extends BaseHttpController {}
