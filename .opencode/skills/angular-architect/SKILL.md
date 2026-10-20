---
name: angular-architect
description: "Use when the Angular architect agent must make or validate structural decisions in the blackboard pattern: layer ownership, component granularity, dependency direction, state scope, and lazy wiring. Deterministic decision rules only — syntax, naming, and task decomposition are owned by other skills."
---

# Angular Architect — Decision Guide

You decide structure; you do not write code. Other skills own syntax, naming, and task
decomposition. **Invariant:** every artifact lives in exactly one layer, and dependencies flow one way.
All planned paths are relative to the **generated project root** (the runner's `--output` folder), not the blackboard repository root.

**Blackboard:** read tasks from `blackboard/queue/` → write the Architecture Plan to
`blackboard/complete/` → on any rule violation write the original payload + the rule number to
`blackboard/error/` instead of a plan.

## Rule 1 — Layer ownership (apply top-down; first match wins)

| # | Condition | Layer |
| --- | --- | --- |
| 1 | App shell component that hosts the routed view (header, footer, nav, side menu) | `layout/` |
| 2 | No UI + app-wide singleton (guards, interceptors, global providers, cross-feature coordination) | `core/` |
| 3 | Domain-free + already imported by ≥2 features | `shared/` |
| 4 | Everything else | `features/<f>/` |

New artifacts start in `features/<f>/`; they move to `shared/` only when condition 3 becomes true.
The shell hosts routes but owns no domain: it contains no business logic, data, or forms — a login
screen is a `features/auth/` page, not shell.

## Rule 2 — Component kind and splitting

- Route target → **container** in `features/<f>/feature/`, class `<Name>PageComponent`.
- Injects a `data/` service or store → **container**; otherwise **presentational** in `features/<f>/ui/`.
- Presentational moves to `shared/ui/` only after a second feature imports it.
- **Split** when file ≥400 lines, or template ≥15 bindings, or container has >3 injected dependencies.

## Rule 3 — Dependencies (no relative import crosses a layer)

| Layer | May import | Never |
| --- | --- | --- |
| `core/` | `core/` | `shared/`, `features/`, `layout/` |
| `shared/` | `shared/` | `core/`, `features/`, `layout/` |
| `features/<f>/` | `core/`, `shared/`, its own feature | any other `features/*` |
| `layout/` | `core/`, `shared/` | `features/` |

Features are closed boxes: other layers reach them only through their routes.

## Rule 4 — State scope (by consumer count)

| Consumers | Location |
| --- | --- |
| One component | signal inside the component |
| One feature | `features/<f>/data/<name>.store.ts` |
| ≥2 features | `core/` |

**One producer per type.** Every type, union, status enum, or DTO is declared in exactly one file and imported everywhere else. A cross-cutting union (e.g. a toast/severity or load-status type) lives in a single `shared/models/` (or `core/models/`) file — never a second, parallel definition, and never a copy carried next to each consumer. Before finalizing the plan, scan every assigned type name: two producers for one name is a rule violation (report to `blackboard/error/`).

## Rule 5 — Wiring

- `app.routes.ts` may reference only `<f>.routes.ts` files, loaded via `loadChildren`.
- Every feature lazy-loads its page components via `loadComponent`.
- Guard/resolver used by ≥2 features → `core/`; otherwise → its feature.

## Rule 6 — Data provisioning (no dead endpoints)

- If any planned service/store consumes remote data (HTTP endpoints or live streams) and the build request provides no real backend, the plan **must** include a dev data-provisioning node. A service that fetches from an endpoint nothing implements is a rule violation.
- Provision it in `core/` (Rule 1 cond. 2): a functional `HttpInterceptorFn` answering exactly the declared endpoints with in-memory fixtures, plus a provider/app-initializer (`.providers.ts`) that seeds the state stores the UI reads on first paint.
- Register the mock layer only through `app.config.ts` providers (`withInterceptors([...])` + the seed provider). Leave generated services unchanged so the layer stays a removable seam.
- The seed must populate every store the first screen reads (e.g. the shell's profile), so no screen renders `error` or empty by default under `ng serve`.

## Output

- **All rules hold** → `blackboard/complete/`: folder tree; per-artifact layer + component kind;
  state/route topology; the data-provisioning node (Rule 6) whenever the request implies remote
  data; and the condition-3 justification for every component in `shared/`.
- **Any rule violated** → `blackboard/error/`: original payload + rule number. Never emit an
  inconsistent plan.
