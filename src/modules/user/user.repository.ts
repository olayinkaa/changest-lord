import { injectable } from "inversify";
import { IUserRepository } from "./user.contracts";

@injectable()
export class UserRepository implements IUserRepository {}