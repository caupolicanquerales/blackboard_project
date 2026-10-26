# Architecture Plan — fitness-trainer-performance-dashboard

Target: Angular 22 (standalone, signals, zoneless), web, grid layout. Skills loaded: task-descomposition, angular-architect (angular-translator per seed).
All rules (Angular architect 1–6) hold; no violations.

## Bootstrapping
`angular.json`/`package.json` missing → Stage 0 task T0-001 (`ng new … --directory . --style=scss --routing --ssr=false --skip-git --defaults`, agent-container).

## Folder tree (relative to project root)
```
src/
  main.ts  index.html  styles.scss
  app/
    app.component.ts  app.config.ts  app.routes.ts
    core/
      models/   phase-progress | toast | trainer-profile | workout-step (.model.ts)
      api/      workout.api.ts
      state/    toast.store | trainer-profile.store | workout.store
      stubs/    mock-backend.interceptor.ts  mock-backend.providers.ts   (Rule 6)
    shared/
      models/   icon-name.model.ts
      ui/       icon.component.ts
    layout/
      header/trainer-header.component.ts
      toast/toast-host.component.ts
      workspace/main-layout.component.ts
    features/
      performance-telemetry-dashboard/
        performance-telemetry-dashboard.routes.ts
        data/    biometric-metric.model | training-ratio.model | telemetry.api | telemetry.store
        feature/ dashboard-page.component.ts (container)
        ui/      biometric-tiles | comparison-split-bars | exercise-step-cards | phase-timeline | radial-gauge-indicator | statistics-bar-widget
      workout-progression-routines/
        workout-progression-routines.routes.ts
        feature/ routines-page.component.ts (container)
        ui/      phase-stepper | step-detail | step-list
```

## Layer / kind decisions
- Layout (Rule 1.1): header (container: TrainerProfileStore + Router), toast host (container: ToastStore), shell (presentational host, router-outlet).
- Core (cond. 2/Rule 4, ≥2 consumers): ToastStore (toast-host, dashboard, workout), TrainerProfileStore, WorkoutStore + WorkoutApi (dashboard and routines both show steps/phases), their models, mock layer.
- Feature-local: TelemetryApi/Store (dashboard only), BiometricMetric, TrainingRatio.
- Shared (cond. 3 justification): `IconComponent`/`IconName` only — domain-free and imported by dashboard (tiles, timeline, cards), routines (stepper, list) and layout header. The seed's stepper/step-card shared_ui are domain-typed (core WorkoutStep/PhaseProgress; shared may not import core), so they are feature-local per feature instead of shared.
- One producer per type: PhaseStatus in phase-progress.model, ToastSeverity in toast.model, IconName in icon-name.model.
- Presentational UI: creation (agent-container) + one `ux` task (agent-ui) with full layoutSpec verbatim, theme, platform; pages also get a `ux` task for grid-area layout.

## State / route topology
- `''` → MainLayoutComponent (header / `<main>` outlet / toast host); `''` redirects to `dashboard`.
- `/dashboard` → lazy `performance-telemetry-dashboard.routes` → DashboardPageComponent (`loadComponent`).
- `/routines` → lazy `workout-progression-routines.routes` → RoutinesPageComponent.
- Live telemetry: TelemetryStore polls `/api/telemetry/snapshot`; threshold breach → warning toast.

## Data provisioning (Rule 6)
`core/stubs/mock-backend.interceptor.ts` answers every declared endpoint (telemetry snapshot/ratios/reset, routine steps, complete step, phases, advance) with in-memory fixtures; `mock-backend.providers.ts` registers it via `provideMockBackend()` in `app.config.ts` and seeds TrainerProfileStore and WorkoutStore at startup. Services stay unchanged (removable seam).

## Task queue
54 tasks, stages 0–8, emitted from /tmp/tasks via runner_github.py --emit.
