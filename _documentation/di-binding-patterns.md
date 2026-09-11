# Dependency Injection Binding Patterns

This document outlines the three primary patterns for binding dependencies in the MyChange Backend using InversifyJS. While we generally strive for the "Gold Standard," different scenarios may justify different approaches.

---

## 1. The "Quick" Pattern (`toSelf`)
In this pattern, the class itself acts as the token. There is no separate symbol or interface.

### Implementation
**Binding:**
```typescript
bind(WebhookService).toSelf();
```
**Injection:**
```typescript
constructor(
    @inject(WebhookService) private webhookService: WebhookService
) {}
```

### Analysis
| Pros | Cons |
| :--- | :--- |
| **Minimal Boilerplate**: No need for a `types.ts` file or interfaces. | **Tight Coupling**: The consumer is directly tied to the concrete implementation. |
| **Fast Prototyping**: Extremely quick to set up for simple services. | **Circular Dependency Risk**: Higher chance of `ReferenceError` (class not defined) if two services inject each other. |
| | **Harder to Mock**: Requires overriding the class binding in the container for tests. |

**When to use:** Very simple, internal-only services with no complex dependencies and no requirement for multiple implementations.

---

## 2. The "Balanced" Pattern (Token without Interface)
This pattern uses a unique `Symbol` as the token but injects the concrete class as the TypeScript type.

### Implementation
**Token Definition:**
```typescript
export const WEBHOOK_TYPES = {
    Service: Symbol.for("WebhookService"),
};
```
**Binding:**
```typescript
bind(WEBHOOK_TYPES.Service).to(WebhookService);
```
**Injection:**
```typescript
constructor(
    @inject(WEBHOOK_TYPES.Service) private webhookService: WebhookService
) {}
```

### Analysis
| Pros | Cons |
| :--- | :--- |
| **Decouples Token from Class**: The container uses a symbol, avoiding most circular dependency issues. | **Concrete Type Leak**: The consumer still knows exactly which class is being used. |
| **Easier Mocking**: You can bind the token to a different class in tests without changing the controller. | **No Contract**: There is no formal interface ensuring the service has specific methods. |
| **Consistency**: Matches the project's general `*.types.ts` structure. | |

**When to use:** When you want the architectural benefits of tokens (testability, avoiding circular refs) but the service is simple enough that a formal interface feels like overkill.

---

## 3. The "Gold Standard" (Token + Interface)
The most robust pattern. The token maps to an interface, and the class implements that interface.

### Implementation
**Interface & Token:**
```typescript
export interface IWebhookService {
    process(data: any): Promise<void>;
}
export const WEBHOOK_TYPES = {
    Service: Symbol.for("WebhookService"),
};
```
**Binding:**
```typescript
bind(WEBHOOK_TYPES.Service).to(WebhookService);
```
**Injection:**
```typescript
constructor(
    @inject(WEBHOOK_TYPES.Service) private webhookService: IWebhookService
) {}
```

### Analysis
| Pros | Cons |
| :--- | :--- |
| **Full Decoupling**: The consumer only knows about the *contract* (Interface), not the *implementation* (Class). | **Maximum Boilerplate**: Requires an interface, a token, and the implementation. |
| **True Polymorphism**: You can switch between `SmsWebhookService` and `EmailWebhookService` just by changing one line in the module. | **More Files**: Adds more lines to `*.types.ts`. |
| **Strict Contracts**: TypeScript ensures the implementation matches the interface exactly. | |

**When to use:** ALL core domain services, repositories, and any component that might have multiple implementations or needs rigorous unit testing.

---

## Summary Comparison Table

| Feature | `toSelf()` | Token $\rightarrow$ Class | Token $\rightarrow$ Interface |
| :--- | :---: | :---: | :---: |
| **Setup Speed** | 🚀 Fast | 🏎️ Medium | 🐢 Slow |
| **Testability** | ⚠️ Low | ✅ High | 🌟 Excellent |
| **Decoupling** | ❌ None | 🟡 Partial | 🟢 Full |
| **Safe from Circular Refs** | ❌ No | ✅ Yes | ✅ Yes |
| **Type Safety** | ✅ Concrete | ✅ Concrete | 🌟 Contract-based |
| **Recommended for** | Prototypes | Simple Services | Core Domain Logic |
