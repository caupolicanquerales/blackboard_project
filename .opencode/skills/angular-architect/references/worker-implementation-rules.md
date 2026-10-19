# Worker Implementation Rules (Angular)

Reference for downstream **component/implementation agents** and build tools. The architect does not
need this document to produce an Architecture Plan; it is consumed when generating `.ts`, `.html`,
and `.scss` files.

---

## A. Version Support Matrix

| Angular | Status | Node.js | TypeScript | RxJS |
| --- | --- | --- | --- | --- |
| **22.x** (default) | Active | `^22.22` \|\| `^24.15` \|\| `^26.0` | `>=6.0 <6.1` | `^6.5.3` \|\| `^7.4.0` |
| 21.x | LTS | `^20.19` \|\| `^22.12` \|\| `^24.0` | `>=5.9 <6.0` | `^6.5.3` \|\| `^7.4.0` |
| 20.x | LTS | `^20.19` \|\| `^22.12` \|\| `^24.0` | `>=5.8 <6.0` | `^6.5.3` \|\| `^7.4.0` |

## B. Modern Angular Baseline (mandatory for new code)

- **Standalone by default.** `standalone: true` is implicit (v19+) and must not be written.
- **Signals-first state**: `signal()`, `computed()`, `effect()`, `linkedSignal()`; signal inputs and
  outputs `input()`, `input.required()`, `output()`, `model()`; queries `viewChild()`,
  `viewChildren()`, `contentChild()`.
- **`inject()`** for DI. No constructor injection in new code.
- **Built-in control flow**: `@if`, `@for` (with `track`), `@switch`, `@defer`.
- **Signal Forms** (stable v22, `@angular/forms/signals`) for new forms; typed reactive forms only when required.
- **`resource()` / `rxResource()`** for async loading instead of manual subscribe pipelines.
- **Zoneless** via `provideZonelessChangeDetection()` for new applications.
- **Functional providers**: `provideRouter`, `provideHttpClient(withInterceptors([...]))`, `provideAppInitializer`.
- **Host bindings** through the `host: {}` object; avoid `@HostBinding` / `@HostListener`.
- **SSR/hydration** via `provideClientHydration()` when required.
- **Styling**: SCSS or Tailwind, component-scoped.
- UI primitives from **Angular Material/CDK** or **Angular Aria** where accessibility is required.

## C. Code Examples

### Feature routes (`loadComponent`)

```ts
// features/orders/orders.routes.ts
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/orders-page.component').then(m => m.OrdersPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./feature/order-detail-page.component').then(m => m.OrderDetailPageComponent),
        resolve: { order: orderResolver },
      },
    ],
  },
];
```

### Root route table (`loadChildren`)

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', component: MainLayoutComponent, children: [
    { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES) },
    { path: 'customers', loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES) },
  ]},
  { path: '**', loadComponent: () => import('./features/not-found/not-found-page.component').then(m => m.NotFoundPageComponent) },
];
```

### Path aliases

```jsonc
{ "paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@features/*": ["src/app/features/*"],
  "@layout/*": ["src/app/layout/*"]
}}
```

## D. Full Naming Rules

File names are kebab-case with a type suffix; class names are PascalCase with the same suffix.

| Artifact | File pattern | Example |
| --- | --- | --- |
| Component | `<name>.component.ts` (+ `.html`, `.scss`, `.spec.ts`) | `user-profile.component.ts` |
| Page (routed container) | `<name>-page.component.ts` | `orders-page.component.ts` |
| Service | `<name>.service.ts` | `auth.service.ts` |
| Signal store | `<name>.store.ts` | `cart.store.ts` |
| API data access | `<name>.api.ts` | `orders.api.ts` |
| Directive | `<name>.directive.ts` | `click-outside.directive.ts` |
| Pipe | `<name>.pipe.ts` | `format-date.pipe.ts` |
| Guard | `<name>.guard.ts` | `auth.guard.ts` |
| Interceptor | `<name>.interceptor.ts` | `auth.interceptor.ts` |
| Resolver | `<name>.resolver.ts` | `order.resolver.ts` |
| Model / type | `<name>.model.ts` | `order.model.ts` |
| Routes | `<name>.routes.ts` | `orders.routes.ts` |
| Provider | `<name>.providers.ts` | `core.providers.ts` |
| Test util | `<name>.harness.ts` / `<name>.builder.ts` | `order.builder.ts` |

### Classes, selectors, and members

- Components: `UserProfileComponent`, `OrdersPageComponent`. Services: `AuthService`. Stores: `CartStore`.
- Directives: `ClickOutsideDirective`. Pipes: `FormatDatePipe`.
- Guards, interceptors, resolvers: camelCase functions (`authGuard`, `authInterceptor`, `orderResolver`).
- Selectors: `app-` prefix, kebab-case (`app-user-profile`). Attribute directives: `[appClickOutside]`.
- No `I`, `T`, or `Abstract` prefixes on interfaces or types (`Order`, not `IOrder`).
- Booleans: `isX`, `hasX`, `canX`, `shouldX`.
- Signals: expose a noun (`orders`); private writable signal prefixed `_` (`_orders`) or `#private`.
- Observables: `$` suffix (`orders$`) only when RxJS is unavoidable.
- Constants: `UPPER_SNAKE_CASE`. Enum members: `PascalCase`.
- Methods: verb-noun (`loadOrders()`, `submitOrder()`).
- Injected fields: camelCase of the type (`private readonly authService = inject(AuthService)`).

## E. Component Implementation Limits

- Keep components under about 400 lines and about 15 template bindings; extract children otherwise.
- Presentational components hold no business logic: formatting goes to pipes, state to `data/*.store.ts`, HTTP to `data/*.api.ts`.
- A container should rarely exceed about 3 injected dependencies.
