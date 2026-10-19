# Architecture Plan — fitness-trainer-performance-dashboard

Project root: `projects/fitness-trainer-performance-dashboard` (all paths relative to it). Target: Angular 22 standalone, signals, zoneless.

## Project bootstrap
Stage 0 required: project root is empty (no `angular.json`/`package.json`).
Command (run from project root, `agent-container`):
`ng new fitness-trainer-performance-dashboard --directory . --style=scss --routing --ssr=false --skip-git --defaults`

## Folder tree
```
src/
  main.ts                       (wiring)
  index.html                    (wiring)
  app/
    app.component.ts|html|scss  (root shell host; injects ToastStore + TrainerProfileStore)
    app.config.ts
    app.routes.ts               (only loadChildren to feature routes)
    core/
      models/   telemetry.model.ts, toast.model.ts, trainer-profile.model.ts
      auth/     trainer-profile.store.ts
      notifications/ toast.store.ts
      telemetry/ telemetry.service.ts
      mock/     dev-api.interceptor.ts, dev-seed.providers.ts   (Rule 6 data provisioning)
    shared/
      models/   workout.model.ts
      ui/chevron-stepper/ chevron-stepper.component.ts|html|scss
      ui/exercise-step-cards/ exercise-step-cards.component.ts|html|scss
    layout/
      trainer-header/ trainer-header.component.ts|html|scss
      toast-overlay/  toast-overlay.component.ts|html|scss
    features/
      dashboard/
        dashboard.routes.ts
        data/    dashboard.model.ts, dashboard.api.ts, dashboard.store.ts
        feature/ dashboard-page.component.ts
        ui/      biometric-tiles/, comparison-bars/, radial-gauges/, statistics-bar/ (*.component.ts)
      routines/
        routines.routes.ts
        data/    routines.api.ts, routines.store.ts
        feature/ routines-page.component.ts
        ui/      step-detail/step-detail.component.ts
```

## Artifacts (layer + kind) and bundles
Each `.ts` below owns its companions `.html`/`.scss`/`.spec.ts` (components) or `.spec.ts` (logic) — companions are NOT separate artifacts/tasks.

| Artifact | Layer | Kind |
|---|---|---|
| core/models/telemetry.model.ts (BiometricMetric, TelemetryThresholds) | core | model |
| core/models/toast.model.ts | core | model |
| core/models/trainer-profile.model.ts | core | model |
| shared/models/workout.model.ts (WorkoutStep, PhaseProgress, ViewState) | shared | model |
| features/dashboard/data/dashboard.model.ts (TrainingRatio, GaugeValue) | features/dashboard | model |
| core/auth/trainer-profile.store.ts | core | store |
| core/notifications/toast.store.ts | core | store |
| core/telemetry/telemetry.service.ts | core | service |
| core/mock/dev-api.interceptor.ts | core | interceptor |
| core/mock/dev-seed.providers.ts | core | provider |
| dashboard.api.ts / dashboard.store.ts | features/dashboard/data | api / store |
| routines.api.ts / routines.store.ts | features/routines/data | api / store |
| shared/ui/chevron-stepper, exercise-step-cards (+ux) | shared | presentational |
| dashboard ui: biometric-tiles, comparison-bars, radial-gauges, statistics-bar (+ux) | features/dashboard/ui | presentational |
| routines ui: step-detail (+ux) | features/routines/ui | presentational |
| dashboard-page, routines-page | feature/ | container (route targets, inject stores) |
| trainer-header, toast-overlay (+ux) | layout | presentational shell parts |
| app.component | root | shell host |

## State topology (Rule 4)
- Toast & Notification, Trainer profile: ≥2 consumers (shell, telemetry, routines) → `core/`.
- Telemetry stream service: core (feeds toast alerts across features).
- Dashboard/Routines state: one feature each → `features/<f>/data/*.store.ts`.

## Route topology (Rule 5)
`app.routes.ts`: `''`→redirect `dashboard`; `dashboard` and `routines` via `loadChildren` of `<f>.routes.ts`; each feature routes file lazy-loads its page via `loadComponent`; `**`→`dashboard`.

## Data provisioning (Rule 6)
No backend. `core/mock/dev-api.interceptor.ts` (`HttpInterceptorFn`) answers: GET `/api/telemetry/snapshot`, GET `/api/telemetry/stream`, GET `/api/dashboard/ratios`, GET `/api/routines/:routineId/steps`, GET `/api/routines/:routineId/phases`, POST `/api/routines/:routineId/steps/:stepId/complete`, POST `/api/routines/:routineId/advance`. `core/mock/dev-seed.providers.ts` seeds `TrainerProfileStore` on init. Both registered only in `app.config.ts`.

## Condition-3 justification for `shared/`
- `ChevronStepperComponent`: imported by dashboard (phase timeline) and routines (phase stepper); domain-free (renders phases).
- `ExerciseStepCardsComponent`: imported by dashboard (exercise steps) and routines (step list).
- `shared/models/workout.model.ts`: types consumed by both shared components and both features.

## Stages
0 bootstrap · 1 models · 2 core · 3 feature data · 4 shared ui · 5 feature ui · 6 containers · 7 routes + layout · 8 app wiring (app.component, app.config, app.routes, index.html, main.ts).
