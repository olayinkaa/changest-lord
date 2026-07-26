import { ContainerModule, ContainerModuleLoadOptions } from "inversify";
import { UserController } from "./user.controller";

export class UserModule extends ContainerModule {
  constructor() {
    super((options: ContainerModuleLoadOptions) => {
      options.bind(UserController).toSelf();
    });
  }
}
