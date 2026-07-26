
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

```ts
import {
  Controller,
  Get,
  HttpStatusCode,
  StatusCode,
} from "@inversifyjs/http-core";

@Controller("/users")
export class UserController {
  @Get()
  @StatusCode(HttpStatusCode.CREATED)
  public async getUsers(): Promise<any[]> {
    return [
      { email: "john@example.com", id: 1, name: "John Doe" },
      { email: "jane@example.com", id: 2, name: "Jane Smith" },
    ];
  }
}

```