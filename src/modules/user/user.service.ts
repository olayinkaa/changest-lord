import { injectable } from "inversify";
import { IUserService } from "./user.contracts";

@injectable()
export class UserService implements IUserService {}
