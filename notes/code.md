
## Inversify Module binding
```ts
export class UserContainerModule extends ContainerModule {
  constructor() {
    super((options: ContainerModuleLoadOptions) => {
      options.bind(UserController).toSelf().inSingletonScope();
      options.bind(UserService).toSelf().inSingletonScope();
    });
  }
}
```

```ts
import type express from "express";
const app: express.Application = await adapter.build();

```