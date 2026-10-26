---
name: angular-ui
description: "Angular-specific UX/UI rules for applying layoutSpec (CSS Grid) and design system. Load dynamically by universal UI agent when framework is Angular."
---

# Angular UI Skill

## CSS Grid implementation
- Apply `layoutSpec.grid` exactly: set host/wrapper to `display: grid`, use `grid-template-columns/rows/areas`, assign `grid-area` per region
- Implement responsive overrides with `@media`
- Use `minmax(0, 1fr)`, prevent overflow

## Angular specifics
- Edit `.html` and `.scss` (and `.ts` only for wiring), never create files for ux
- Keep `input()`/`output()` intact
- Use modern template control flow `@if`/`@for`/`@switch`, standalone (no `standalone: true`), no NgModule
- Apply design tokens as CSS custom properties

## Root component adaptation (Stage 0/Stage 8)
- After Stage 0 normalization, `app.component.ts/html/scss/spec.ts` is the single root with `selector: 'app-root'`
- For root component tasks (`layer: root`, `path: src/app/app.component.ts`), replace Angular starter/welcome markup with the product shell from the seed/layoutSpec
- Never create a second root or edit `main.ts`/`index.html` unless explicitly tasked
- Keep `selector: 'app-root'` intact
