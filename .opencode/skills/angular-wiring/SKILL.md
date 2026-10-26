---
name: angular-wiring
description: "Angular routing/provider/config/wiring rules. Load dynamically for Angular projects."
---

# Angular Wiring Skill

- Routes use `loadComponent`/`loadChildren`, no eager imports across features from app.routes
- Functional providers (`provideRouter`, `provideHttpClient`, etc.), no NgModule
- `index.html`: set lang/title/meta, keep exactly one `<app-root>`
- Wire only declared providers/stores
