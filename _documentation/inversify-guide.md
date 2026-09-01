# InversifyJS Architecture Guide

This document provides a comprehensive guide to how Dependency Injection (DI) is implemented in the MyChange Backend using InversifyJS.

## 1. What is InversifyJS?

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

---

## 2. Core Concepts

### `@injectable()`
This decorator marks a class as available to be managed by the Inversify container. Without this, the container cannot instantiate the class or inject dependencies into it.

### `@inject(TOKEN)`
Since TypeScript interfaces are erased during compilation (they don't exist at runtime), Inversify cannot use the interface type itself as a key to find the implementation. Instead, it uses **Tokens** (usually `Symbols` or strings).

### The `Container`
The `Container` is the brain of the operation. It maintains a map of `Token -> Implementation`. When you request a class from the container, it recursively resolves all its `@inject` dependencies.

---

## 3. Binding Mechanisms

Binding is the process of telling the container: *"Whenever someone asks for TOKEN X, give them implementation Y."*

### Common Binding Methods
- `bind(TOKEN).to(Implementation)`: Binds a token to a class.
- `bind(TOKEN).toSelf()`: Binds a class to itself (the class acts as its own token).
- `bind(TOKEN).toConstantValue(value)`: Binds a token to a specific object or value (e.g., a config object).
- `bind(TOKEN).toDynamicValue((context) => ...)`: Binds a token to a value calculated at runtime.

### Scopes (Lifetimes)
- `inSingletonScope()`: One instance is created and reused for the entire application lifetime. (Default for most services).
- `inTransientScope()`: A new instance is created every time it is injected.
- `inRequestScope()`: One instance is created per HTTP request (useful for request-specific logging or auth contexts).

---

## 4. ContainerModules

As the app grows, putting all bindings in one file becomes unmanageable. `ContainerModule` allows us to group related bindings into a modular unit.

In this project, every domain has its own module:
`src/modules/user/user.module.ts` $\rightarrow$ `new ContainerModule((bind) => { ... })`

These modules are then loaded into the main app container in `src/app.module.ts`.

---

## 5. Binding to Interfaces

This is the most critical pattern in the codebase. We rarely bind a service directly to its class; instead, we bind a **Symbol (Interface Token)** to a **Class (Implementation)**.

### The Workflow:
1. **Define the Interface**: `IUserService` (Defines the contract).
2. **Define the Token**: `TYPES.UserService = Symbol.for("UserService")`.
3. **Implement the Interface**: `UserService implements IUserService`.
4. **Bind in Module**: `bind(TYPES.UserService).to(UserService)`.
5. **Inject**: `@inject(TYPES.UserService) private userService: IUserService`.

---

## 6. Benefits of Binding to Interfaces

### A. Decoupling (The Dependency Inversion Principle)
The high-level business logic (Service) does not depend on the low-level implementation (Repository). Both depend on an abstraction (Interface).

### B. Seamless Mocking for Testing
You can swap a real database repository for a mock repository in your tests without changing a single line of code in your service.
```typescript
// In production: 
container.bind(TYPES.UserRepository).to(UserRepository);

// In tests:
container.bind(TYPES.UserRepository).to(MockUserRepository);
```

### C. Interchangeable Implementations
If the business decides to move from Cloudinary to AWS S3 for file storage:
1. Create `S3StorageService` that implements `IStorageService`.
2. Change **one line** in `adapters.module.ts`:
   `bind(TYPES.IStorageService).to(S3StorageService);`
3. Every service using `IStorageService` is automatically updated.

---

## 7. Project Summary: The Dependency Chain

In MyChange Backend, the flow typically looks like this:

**`Controller`** $\xrightarrow{\text{@inject(TYPES.Service)}}$ **`Service`** $\xrightarrow{\text{@inject(TYPES.Repository)}}$ **`Repository`** $\xrightarrow{\text{Prisma}}$ **`Database`**

Each layer is bound to an interface token, ensuring that the application remains flexible, testable, and maintainable.
