# Architecture Plan — fitness-trainer-performance-dashboard

Target: Angular 22 (standalone, signals, zoneless). Project root: `projects/fitness-trainer-performance-dashboard`.

## Project bootstrap
Stage 0 required (`angular.json`/`package.json` missing). Command (T0-001, run from project root):
`ng new fitness-trainer-performance-dashboard --directory . --style=scss --routing --ssr=false --skip-git --defaults`

## Folder tree (`src/app/`)
```
core/
  alerts/toast.store.ts                    store      (ToastStore)
  api/trainer-profile.api.ts               api
  biometrics/biometric-telemetry.service.ts service
  mock/dev-backend.interceptor.ts          interceptor (Rule 6 dev data)
  models/{biometric-metric,notification,trainer-profile}.model.ts
  profile/trainer-profile.store.ts         store
  providers/dev-seed.providers.ts          provider (app initializer seed)
shared/
  models/{icon-name,phase-progress,view-state,workout-step}.model.ts
  ui/icon/ , ui/chevron-stepper/ , ui/step-card-list/   (presentational)
features/
  dashboard/{data/{dashboard.api,dashboard.store,training-ratio.model}.ts,
             ui/{biometric-tiles,comparison-split-bars,radial-gauges,statistics-bar}/,
             feature/dashboard-page.component.ts, dashboard.routes.ts}
  routines/{data/{routines.api,routines.store}.ts, ui/step-detail/,
            feature/routines-page.component.ts, routines.routes.ts}
layout/{toast-host,trainer-avatar,trainer-header}/
app.component.ts, app.config.ts, app.routes.ts ; src/index.html, src/main.ts
```
Each component `.ts` carries its `.html/.scss/.spec.ts` bundle (creation task + one `ux` task for presentational ones).

## Layer / kind per artifact
- layout (presentational, inputs only): trainer-header, trainer-avatar (hero avatar slot, bound to header col 1), toast-host. Shell state (profile, toasts, Router) is held by `AppComponent` (root, 3 injections).
- core (app-wide singletons): ToastStore (dashboard, routines, telemetry, shell), TrainerProfileStore (shell), BiometricTelemetryService (dashboard + alerts), dev interceptor + seed provider.
- shared/ui: icon, chevron-stepper, step-card-list. Condition-3 justification: all domain-free and imported by both `dashboard` and `routines` (icon also via layout/dashboard/shared cards).
- features/dashboard/ui: biometric-tiles, comparison-split-bars, radial-gauges, statistics-bar (single-feature → stay in feature). Container: DashboardPageComponent (2 injections).
- features/routines/ui: step-detail. Container: RoutinesPageComponent (1 injection).

## Type ownership (one producer each)
BiometricMetric, Notification/ToastSeverity, TrainerProfile → `core/models`; PhaseProgress/PhaseStatus, WorkoutStep, ViewState, IconName → `shared/models` (shared UI cannot import core); TrainingRatio → dashboard `data/`.
Core never imports shared/features; mock interceptor uses plain literals.

## State / route topology
- Global (≥2 consumers): ToastStore, TrainerProfileStore, BiometricTelemetryService in `core/`.
- Feature stores: DashboardStore, RoutinesStore (own APIs; both feature-local).
- Routes: `app.routes.ts` → `''`→redirect `dashboard`; `dashboard` and `routines` via `loadChildren` of `<f>.routes.ts`, which lazy-load pages via `loadComponent`.

## Data provisioning (Rule 6)
No backend supplied → `devBackendInterceptor` answers `/api/trainer/profile`, `/api/telemetry/{snapshot,live}`, `/api/training-ratios[/reset]`, `/api/phases[/advance]`, `/api/routines/:id/steps[/:stepId/complete]`; `provideDevSeed()` loads profile + telemetry (and starts stream) at app init. Both registered only in `app.config.ts`.

## Stages
0 bootstrap · 1 models · 2 core · 3 feature data bundles · 4 shared · 5 feature ui · 6 containers · 7 routes + layout · 8 app root/config/routes/index/main. See queued tasks T0-001 … T8-005 (50 tasks). `ux` intents embed the seed grids/theme verbatim.
