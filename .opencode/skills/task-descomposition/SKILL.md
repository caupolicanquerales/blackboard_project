---
name: task-descomposition
description: "Use when the Angular architect agent must decompose an Architecture Plan into task files for blackboard/queue/. Provides the strict execution sequence, the target-agent mapping by file type, and the exact task JSON schema. Deterministic decision rules only — syntax, naming, and code implementation are owned by other skills."
---

# Task Decomposition — Queue Emission

One `.ts` artifact = one **creation** task = `blackboard/queue/<id>.json`. Companion files (`.html`/`.scss`/`.spec.ts`) are **never** separate tasks; they ride with their `.ts` artifact. A worker may claim a task only when every `dependsOn` id **and** its `Requires` stages (§1) are in `blackboard/complete/`. Every task `path` is relative to the **generated project root** (the runner's `--output` folder, default `projects/<seed name>`), never the blackboard repository root. The runner derives the root from `--output` or the seed's `project.name` and passes the absolute path to every worker.

## 1. Execution sequence (first match wins; `*.model.ts` → stage 1)

- **Stage 0 (project bootstrap — only if `angular.json`+`package.json` are missing in the project root):** Scaffold the workspace **inside the generated project root** (the runner's `--output` folder, default `projects/<seed name>`) via Angular CLI (run by `agent-container`). The command MUST include `--directory .` so `angular.json`/`src/` land directly in that root and match every `src/app/...` task path. No Requires. Synthetic `path` (e.g. `project-bootstrap`/`ng-new`); `layer=root`, `feature=null`, `kind=config`; `export` e.g. `BootstrapProject`. `dependsOn=[]`. Emit before stage 1.
- **Two-phase presentational components:** every presentational component (`features/<f>/ui/**`, `layout/**`) is split into (a) a **creation** task (`kind=ui`, `agent-container`) that scaffolds `.ts`/`.html`/`.scss` via the Angular CLI, and (b) exactly one **UX** task (`kind=ux`, `agent-ui`) that depends on it and applies layout/styling/accessibility/template design. Containers (`feature/`) and `app.component.ts` are single creation tasks (no `ux`).
- **Data provisioning (dev backend):** when the plan includes a dev data-provisioning node (`angular-architect` Rule 6), emit it as ordinary `core/` stage-2 artifacts — the mock `HttpInterceptorFn` (`*.interceptor.ts`, `agent-core`) and the seed provider (`*.providers.ts`, `agent-wiring`) — and let the Stage 8 `app.config.ts` task register them. Never leave a consumed endpoint without a producing task.

| Stage | Artifacts (path) | Requires |
|---|---|---|
| 0 | project bootstrap | — |
| 1 | `*.model.ts`, `shared/models/**` | — |
| 2 | `core/**` | 1 |
| 3 | `features/<f>/data/**` | 1,2 |
| 4 | `shared/**` (rest) | 1 |
| 5 | `features/<f>/ui/**` | 1,4 |
| 6 | `features/<f>/feature/**` | 1,2,3,5 |
| 7 | `features/<f>/<f>.routes.ts`, `layout/**` | 2,4,6 |
| 8 | `app.*.ts`, `main.ts`, `index.html` | 7 |

Emit sorted by `(stage, path, kind-rank)` ascending, where `kind-rank` is `0` for creation tasks and `1` for `ux` tasks. `dependsOn` may reference only tasks sorting before it. Unmatched path → reject.
A producer must be created before any task that reads it: add the producer task to the consumer's `dependsOn` when the producer sorts before it. When the producer cannot sort first (same stage, later path), the consumer is still safe because both intents carry the identical interface contract above — it is written against the declared API, not against a guessed one.

## 2. Target agent mapping (first match wins)

| Pattern | `targetAgent` |
|---|---|
| `*.routes.ts`, `*.providers.ts`, `app.config.ts`, `main.ts`, `index.html` | `agent-wiring` |
| `*.model.ts` | `agent-model` |
| `*.service.ts`, `*.store.ts`, `*.api.ts`, `*.guard.ts`, `*.interceptor.ts`, `*.resolver.ts` | `agent-core` |
| `*.pipe.ts`, `*.directive.ts` | `agent-ui` |
| `app.component.ts` | `agent-ui` |
| any other `*.component.ts` (creation) | `agent-container` |
| `kind=ux` (any component) | `agent-ui` |
| Stage 0 (bootstrap) | `agent-container` |
| else | reject |

## 3. Task schema (exact)

```json
{
  "id": "T5-002",
  "targetAgent": "agent-ui",
  "stage": 5,
  "dependsOn": ["T5-001"],
  "path": "src/app/features/orders/ui/orders-table.component.ts",
  "kind": "ux",
  "layer": "features",
  "feature": "orders",
  "export": "OrdersTableComponent",
  "intent": "Spatial: display=grid; columns=minmax(0, 1fr); rows=auto 1fr; gap=1rem; areas=\"toolbar\" \"table\"; regions=[toolbar, table]; responsive=[{name=mobile, maxWidth=639px, columns=1fr, areas=\"toolbar\" \"table\"}]. Style: modern-corporate tokens, AA contrast, focus-visible, reduced-motion. A11y: keyboard-accessible row selection."
}
```

- `id`: `^T[0-8]-\d{3}$`; stage number = `stage`; ordinal = position after sorting that stage by `(path, kind-rank)`; unique.
- `targetAgent`/`stage`: §2/§1. `path`: under `src/app/` for stages >=1 — except the Stage 8 bootstrap entries `src/main.ts` and `src/index.html` (Stage 0: synthetic `path`). `main.ts` is a real Stage 8 task (`agent-wiring`, `kind=config`) that wires `bootstrapApplication(<Root>, appConfig)` and `dependsOn` the root component and `app.config.ts` tasks; it is never left to chance. `index.html` is likewise a Stage 8 task (`agent-wiring`, `kind=config`, `layer=root`) that rewrites the document shell — product `lang`/`<title>`/meta and the single `<app-root>` mount point — so the CLI's default document is replaced; it `dependsOn` the root component task.
- `dependsOn`: existing ids sorting before; `[]` if independent. Every `ux` task must list the creation task id of the same component.
- `kind`: `model|service|store|api|guard|interceptor|resolver|pipe|directive|route|provider|config`; creation components are `container` inside `feature/`, else `ui`; UX refinement is `ux`. Stage 0: `config`.
- `layer`: `core|shared|features|layout|root` (root only `app.config.ts`/`app.routes.ts`/`app.component.ts`/`main.ts`/`index.html`; Stage 0 may use `root`).
- `feature`: name iff `layer=="features"` else `null`. Stage 0: `null`.
- `export`: primary exported symbol (Stage 0: e.g. `BootstrapProject`).
- `intent`: a compact directive string. Creation intent states the artifact's responsibility; `ux` intent **must embed the component's explicit spatial spec** copied from the seed `grid` (`global_requirements.grid` for `layout/**`, `features[<f>].grid` for `features/<f>/ui/**`) — `display`, `columns`, `rows`, `gap`, `areas`, `regions`, and **every** `responsive` override — followed by style/a11y/template directives (never prose-only); Stage 0 intent states the exact Angular CLI command(s).
- **Interface contract (`service`/`store`/`api`):** the `intent` of any `service`/`store`/`api` task **must declare its public API signatures** — method name, parameters with types, return type (e.g. `ToastStore.show(message: string, severity: ToastSeverity): string`). Any task that consumes another artifact **must restate the exact signatures it calls**, character-for-character with the producer's intent. The architect assigns identical signatures to producer and consumer; workers treat them as a binding contract and never invent a method (see `agent-core`).

**Any violation** → payload + failed rule to `blackboard/error/`; never queue wrong stage, agent, or dependency.
