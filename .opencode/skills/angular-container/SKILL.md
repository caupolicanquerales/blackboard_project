---
name: angular-container
description: "Angular-specific rules for container/ui component creation and Stage 0 bootstrap using Angular CLI. Load dynamically by universal component agents when framework is Angular."
---

# Angular Container Skill

## Stage 0 (Angular bootstrap)
- If missing `angular.json` and `package.json` in project root, run Angular CLI: `ng new <name> --directory . --style=scss --routing --ssr=false --skip-git --defaults`
- Must include `--directory .` so files land directly in project root
- Normalize scaffold: Angular 20+ may emit `app.ts`; rename to `app.component.ts` with class `AppComponent`, keep selector `app-root`, update `main.ts` to bootstrap `AppComponent`, remove duplicates

## Component scaffolding (Angular)
- For `kind` container/ui: generate via `ng generate component <path-without-src/app-and-suffix> --flat --type=component --style=scss` with `--cwd <projectRoot>`
- Required flags: `--flat`, `--type=component`
- Always create/update sibling `<name>.component.spec.ts`
- Fix specs for required inputs/injections without weakening public API
- Use modern Angular: `@if`/`@for`/`@switch`, standalone by default (no `standalone: true`), no NgModule
- Keep deps ≤ 3, no cross-feature imports
- Leave UX/styling to agent-ui

## Conventions
- CLI generates `.ts/.html/.scss/.spec.ts` with selector/templateUrl/styleUrls
- Container injects services/stores via `inject()`, presentational uses `input()`/`output()`
