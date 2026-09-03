# InversifyJS & Inversify-Express-Utils Guide

This document provides a comprehensive guide to how Dependency Injection (DI) and the Web Framework integration are implemented in the MyChange Backend.

## Part 1: InversifyJS (Core DI)

### 1. What is InversifyJS?
InversifyJS is a powerful, lightweight **Inversion of Control (IoC)** container for TypeScript and JavaScript. It allows us to decouple the creation of a class from its usage, promoting the **Dependency Inversion Principle** (the 'D' in SOLID).

Instead of a class manually instantiating its dependencies:
```typescript
// ❌ Bad: Tight Coupling
class UserService {
  private repo = new UserRepository(); 
}
```

The class "asks" for its dependencies, and the IoC container provides them:
```typescript
// ✅ Good: Loose Coupling
class UserService {
  constructor(@inject(TYPES.UserRepository) private repo: IUserRepository) {}
}
```

### 2. Core Concepts

#### `@injectable()`
This decorator marks a class as available to be managed by the Inversify container. Without this, the container cannot instantiate the class or inject dependencies into it.

#### `@inject(TOKEN)`
Since TypeScript interfaces are erased during compilation, Inversify uses **Tokens** (usually `Symbols` or strings) to identify the dependency at runtime.

#### The `Container`
The `Container` maintains a map of `Token -> Implementation`. When you request a class, it recursively resolves all its `@inject` dependencies.

### 3. Binding Mechanisms
Binding is telling the container: *"Whenever someone asks for TOKEN X, give them implementation Y."*

#### Common Binding Methods
- `bind(TOKEN).to(Implementation)`: Binds a token to a class.
- `bind(TOKEN).toSelf()`: Binds a class to itself.
- `bind(TOKEN).toConstantValue(value)`: Binds a token to a specific object/value.
- `bind(TOKEN).toDynamicValue((context) => ...)`: Binds a token to a runtime calculated value.

#### Scopes (Lifetimes)
- `inSingletonScope()`: One instance reused for the entire app lifetime. (Default).
- `inTransientScope()`: A new instance created every time it is injected.
- `inRequestScope()`: One instance created per HTTP request.

### 4. ContainerModules
To avoid a monolithic binding file, we use `ContainerModule` to group related bindings.
Every domain has its own module: `src/modules/<name>/<name>.module.ts`.

### 5. Binding to Interfaces (The Gold Standard)
We rarely bind services directly to classes. Instead:
1. **Define Interface**: `IUserService`
2. **Define Token**: `TYPES.UserService = Symbol.for("UserService")`
3. **Implement**: `UserService implements IUserService`
4. **Bind**: `bind(TYPES.UserService).to(UserService)`
5. **Inject**: `@inject(TYPES.UserService) private userService: IUserService`

---

## Part 2: Inversify-Express-Utils (Web Integration)

`inversify-express-utils` allows us to use Inversify decorators to define Express controllers, making the routing declarative and the controllers injectable.

### 1. Controller Definition
Controllers must be decorated with `@controller` and extend `BaseHttpController`.

```typescript
@controller("/onboarding")
export class OnboardingController extends BaseHttpController {
  constructor(
    @inject(ONBOARDING_TYPES.Service) private onboardingService: IOnboardingService
  ) {
    super();
  }
}
```

### 2. Routing Decorators
Instead of `router.get(...)`, we use method decorators:
- `@httpGet(path)`: Handles GET requests.
- `@httpPost(path)`: Handles POST requests.
- `@httpPut(path)`: Handles PUT requests.
- `@httpDelete(path)`: Handles DELETE requests.
- `@httpPatch(path)`: Handles PATCH requests.

```typescript
@httpPost("/validate-phone")
public async validatePhone(...) { ... }
```

### 3. Parameter Injection
We can inject Express request data directly into method parameters using decorators:

| Decorator | Description | Example |
| :--- | :--- | :--- |
| `@requestBody()` | Injects the parsed `req.body` | `@requestBody() body: CreateUserDto` |
| `@requestParam(name)` | Injects a URL parameter (`:name`) | `@requestParam("id") id: string` |
| `@queryParam(name)` | Injects a query string parameter | `@queryParam("email") email: string` |
| `@request()` | Injects the full Express `Request` object | `@request() req: Request` |
| `@next()` | Injects the Express `NextFunction` | `@next() nxt: NextFunction` |

### 4. Response Handling
Since controllers extend `BaseHttpController`, they have access to helper methods for sending responses:

- `this.json(payload, status)`: Sends a JSON response.
- `this.send(payload, status)`: Sends a plain text or HTML response.
- `this.status(status)`: Sends only the HTTP status code.

```typescript
return this.json(ApiResponse.success(data), 200);
```

### 5. The Dependency Chain in MyChange
The full flow of a request in this project:

**`Request`** $\rightarrow$ **`Inversify-Express-Utils Router`** $\rightarrow$ **`Controller`** $\xrightarrow{\text{@inject}}$ **`Service`** $\xrightarrow{\text{@inject}}$ **`Repository`** $\rightarrow$ **`Prisma`** $\rightarrow$ **`DB`**

This architecture ensures that every layer is decoupled and can be independently tested or replaced.
