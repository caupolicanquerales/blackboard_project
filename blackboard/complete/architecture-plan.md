# Architecture Plan — endurance-multisport-telemetry

Framework: react-native (Expo, TypeScript) · platform: mobile · layout: flexbox · theme: dark (#121212, accent #FF3B30)
Skills loaded: task-descomposition, react-architect (seed also lists react-translator/ui/container/core/model/wiring, referenced in task stamps).

## Bootstrap (Stage 0)
Project root has no `package.json`/`app.json` → T0-001: `npx create-expo-app@latest . --template blank-typescript --yes`, normalize, install planned deps (React Navigation, zustand, react-native-svg, expo-haptics, vector icons, jest-expo, testing-library).

## Folder tree
```
App.tsx                                     root, inline providers (wiring, T8)
src/
  core/
    models/  athlete-profile, biometric-metric, notification-severity, notification,
             phase-progress-status, phase-progress, training-ratio, workout-step
    navigation/types.ts                     typed param lists (single producer)
    api/     api-client.ts, mock-api.ts     (mock = Rule 6 provisioning)
    config.ts
    services/ athlete, telemetry, workout
    store/   athlete-profile, notification, telemetry, workout   (zustand)
    providers/seed.provider.tsx             (Rule 6 seed provider)
  shared/
    models/  interval-card-item, load-status, step-state, timeline-step
    hooks/useResponsiveLayout.ts
    theme/tokens.ts
    components/ BottomActionBar, HorizontalStepperTimeline, IntervalExerciseCards
  layout/
    AppShell/ AthleteHeaderBanner/ ToastBannerHost/
    navigation/root.navigator.tsx           bottom tabs: Dashboard, Routines, Profile
  features/
    dashboard/ components/{BiometricTelemetryCards,ComparisonSplitBars,LiveTelemetryStatisticsBar,RadialGaugeIndicator}
               hooks/useDashboardData.ts  screens/DashboardScreen  dashboard.navigator.tsx
    routines/  hooks/useRoutineExecution.ts  screens/{RoutinesScreen,WorkoutDetailScreen,ActiveExecutionScreen}
               routines.navigator.tsx
    profile/   screens/ProfileScreen  profile.navigator.tsx   (derived from the Profile tab)
```
Every presentational component ships `index.tsx`, `<Name>.types.ts`, `<Name>.test.tsx` as companions (no separate tasks).

## Layer / kind decisions (Rule 1–2)
- layout: AppShell (container), AthleteHeaderBanner, ToastBannerHost (presentational), root.navigator.
- core: models used by stores/services, api client + mock, services, stores (Rule 4: telemetry, notification, athlete, workout are consumed by ≥2 features or the shell), seed provider.
- shared (condition 3, domain-free and used by dashboard + routines): BottomActionBar, HorizontalStepperTimeline, IntervalExerciseCards, useResponsiveLayout, theme tokens, UI view-models.
- features: dashboard-only components (4), screens (containers), feature hooks (keep containers ≤3 deps).

## Type ownership (one producer per type)
Domain types live in `core/models`; because shared may not import core (Rule 3), shared components consume distinct UI view-models (`TimelineStep`, `IntervalCardItem`, `StepState`, `LoadStatus`) mapped by feature hooks (`PhaseStatus → StepState`, `WorkoutStep → IntervalCardItem`). No name has two producers.

## State & navigation topology
- Stores: telemetry (stream, zone-threshold toasts, sensor disconnect), notification (toast queue), athlete-profile, workout (steps/phases, transition toasts).
- Navigation: RootNavigator (bottom tabs) mounts only `dashboard.navigator`, `routines.navigator` (RoutinesList → WorkoutDetail / ActiveExecution stack), `profile.navigator` (Rule 5). Route names are screen names, no `/`.
- Provider order in App.tsx: SafeAreaProvider → NavigationContainer → SeedProvider → AppShell → RootNavigator.

## Data provisioning (Rule 6)
No backend exists → `core/api/mock-api.ts` answers exactly: GET /athlete/profile, GET /telemetry/snapshot, GET /telemetry/ratios, POST /telemetry/reset, GET /routines/:id/steps, GET /routines/:id/phases, POST /routines/:id/steps/:stepId/complete, POST /routines/:id/advance-phase, plus the `telemetry` live stream. `core/providers/seed.provider.tsx` installs the adapter at the app root and seeds profile/telemetry/workout stores before first paint.

## Stages / tasks
| Stage | Content | Agents |
|---|---|---|
| 0 | T0-001 Expo bootstrap | agent-container |
| 1 | T1-001..013 models, nav param types | agent-model |
| 2 | T2-001..005 api client, mock api, config, responsive hook, theme tokens | agent-core, agent-wiring, agent-ui |
| 3 | T3-001..009 services, stores, feature hooks | agent-core |
| 4 | T4-001..009 presentational components | agent-container |
| 5 | T5-001..009 UX/layoutSpec/a11y refinement (verbatim layoutSpec) | agent-ui |
| 6 | T6-001..006 screens + AppShell | agent-container |
| 7 | T7-001..005 seed provider, navigators | agent-wiring |
| 8 | T8-001 App.tsx | agent-wiring |
