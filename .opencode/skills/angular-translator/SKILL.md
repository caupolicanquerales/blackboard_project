---
name: angular-translator
description: "Angular-specific rules for translating descriptions into the blackboard seed contract. Contains Angular target defaults, grid-to-component mapping conventions, and the seed schema details specific to Angular 22 (Standalone, Signals, Zoneless). Load dynamically by the universal spec translator when target framework is Angular."
---

# Angular Translator Skill

## Default target
- When the description does not specify a stack, use `"target": "Angular 22 (Standalone, Signals, Zoneless)"`.
- When generating project context, prefer kebab-case for `project.name`.

## Angular blackboard integration
- The seed is consumed by the Angular architect and task decomposition pipeline which assumes Angular CLI project structure under `projects/<project.name>`.
- `target` must be set to Angular 22 with Standalone components, Signals, and Zoneless configuration when using the Angular pipeline.

## Shared UI mappings (Angular-oriented)
- Components are created as standalone where possible; routing uses lazy loading patterns.
- Widget types map to Angular component patterns (presentational components in `ui/`, containers in `feature/`).
- The `shared_ui` entries describe reusable Angular components with their CSS grid specifications.

## Grid to Angular component mapping
- Each region becomes a component or section in the Angular layout.
- Shell grid maps to `app.component` with layout regions.
- Feature grids map to feature components.
- Widget grids in `shared_ui` describe local CSS Grid layouts for reusable components.

## Theme tokens
- Angular Material or custom styling can use the theme tokens; `global_requirements.theme` is passed verbatim to `agent-ui`.
- Default theme if unspecified: `{"mode": "light", "background": "#ffffff", "accent": "neutral", "headingStyle": "regular"}` (but the spec translator's defaults take precedence as written).
