---
name: task-descomposition
description: "Use when the Angular architect agent must decompose an Architecture Plan into task files for blackboard/queue/. Provides the strict execution sequence, the target-agent mapping by file type, the exact task JSON schema, and pre-emission validation invariants. Deterministic decision rules only — syntax, naming, and code implementation are owned by other skills."
---

# Task Decomposition — Queue Emission

One `.ts` artifact = one **creation** task = `blackboard/queue/<id>.json`. Companion files (`.html`/`.scss`/`.spec.ts`) are **never** separate tasks; they ride with their `.ts` artifact. A worker may claim a task only when every `dependsOn` id **and** its `Requires` stages (§1) are in `blackboard/complete/`. Task `path`s are relative to the **generated project root** (runner `--output`, default `projects/<seed name>`; workers receive it as an absolute path) — never the blackboard repository root.

## 1. Execution sequence (first match wins; `*.model.ts` → stage 1)

- **Stage 0 — bootstrap, only if `angular.json`+`package.json` are missing:** `agent-container` runs Angular CLI **inside the project root**; the command MUST include `--directory .` so `angular.json`/`src/` land directly in that root. No Requires; synthetic `path` (e.g. `project-bootstrap`); `layer=root`, `feature=null`, `kind=config`, `dependsOn=[]`; emit before stage 1.
- **Two-phase presentational components:** every presentational component (`features/<f>/ui/**`, `layout/**`) splits into (a) a **creation** task (`kind=ui`, `agent-container`) and (b) exactly one **UX** task (`kind=ux`, `agent-ui`) depending on it — layout/styling/accessibility/template only. Containers (`feature/`) and `app.component.ts` are single creation tasks (no `ux`).
- **Complete feature data bundle (mandatory):** for every feature with a container or `ux` consumer, emit a stage-3 `features/<f>/data/**` bundle — `*.model.ts` (DTOs/VMs), `*.api.ts`, and the state `*.store.ts` — one task each. Never emit a lone store and leave the api/model to workers. A `ux` intent that consumes a feature store **must** list that store's id (and every injected service) in `dependsOn`, so the producer is `complete/` before the consumer reads it.
- **Data provisioning (dev backend):** Rule-6 nodes → ordinary stage-2 `core/` artifacts — mock `*.interceptor.ts` (`agent-core`), `*.providers.ts` (`agent-wiring`) — registered by the Stage 8 `app.config.ts` task. Never leave a consumed endpoint without a producing task.

| Stage | Artifacts (path) | Requires |
|---|---|---|
| 0 | project bootstrap | — |
| 1 | `*.model.ts`, `shared/models/**` | — |
| 2 | `core/**` | 1 |
| 3 | `features/<f>/data/**` (incl. `*.model.ts`) | 1,2 |
| 4 | `shared/**` (rest) | 1 |
| 5 | `features/<f>/ui/**` | 1,4 |
| 6 | `features/<f>/feature/**` | 1,2,3,5 |
| 7 | `features/<f>/<f>.routes.ts`, `layout/**` | 2,4,6 |
| 8 | `app.*.ts`, `main.ts`, `index.html` | 7 |

Emit sorted by `(stage, path, kind-rank)` ascending (`kind-rank`: 0 creation, 1 `ux`); `dependsOn` may reference only tasks sorting before it. When producer and consumer share a stage with the producer later, both intents carry identical interface signatures (§3) — the consumer binds to the declared API, never a guessed one.

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
  "intent": "Spatial: display=grid; columns=minmax(0, 1fr); rows=auto 1fr; gap=1rem; areas=\"toolbar\" \"table\"; matrix=[[toolbar, table]]; regions=[{name=toolbar, area=toolbar, type=toolbar, chart=none, layout=stack-h, content=elements: …}, {name=table, area=table, type=table, chart=none, layout=stack-v, content=elements: …}]; responsive=[{name=mobile, maxWidth=639px, columns=1fr, areas=\"toolbar\" \"table\", matrix=[[toolbar], [table]]}]. Theme: mode=dark; background=#121212; accent=neon orange/red; headingStyle=bold italic. Style: modern-corporate tokens, AA contrast, focus-visible, reduced-motion. A11y: keyboard-accessible row selection."
}
```

- `id`: `^T[0-8]-\d{3}$`; middle number = `stage`; ordinal = position after sorting by `(path, kind-rank)`; unique.
- `targetAgent`/`stage`: §2/§1.
- `path`: under `src/app/` for stages ≥1; Stage 0 synthetic (never under `src/app/`); Stage 8 includes `src/main.ts` (wires `bootstrapApplication(<Root>, appConfig)`; deps: root component + `app.config.ts`) and `src/index.html` (document shell + `<app-root>` mount; deps: root component) — both `agent-wiring`, `kind=config`.
- `dependsOn`: ids sorting before; `[]` if independent.
- `kind`: `model|service|store|api|guard|interceptor|resolver|pipe|directive|route|provider|config`; creation components: `container` inside `feature/`, else `ui`; UX refinement: `ux`; Stage 0: `config`.
- `layer`: `core|shared|features|layout|root` (root only `app.config.ts`/`app.routes.ts`/`app.component.ts`/`main.ts`/`index.html`; Stage 0 may use `root`).
- `feature`: name iff `layer=="features"` else `null`.
- `export`: primary exported symbol.
- **`ux` intent — embed the spec-translator seed contract verbatim:** the matched `grid` in full — `global_requirements.grid` for `layout/**`, `features[<f>].grid` for `features/<f>/ui/**`: `display`, `columns`, `rows`, `gap`, `areas`, `matrix`, every `regions[]` entry with ALL keys (`name`, `area`, `type`, `chart`, `layout`, `content`), and every `responsive` override — plus `global_requirements.theme` tokens, then style/a11y/template directives. The seed passed `writer_file.py` matrix/enum/content invariants — copy as-is; never re-derive, shorten, or paraphrase; never prose-only.
- **Interface contract (`service`/`store`/`api`):** intent declares public API signatures (method, typed params, return type — e.g. `ToastStore.show(message: string, severity: ToastSeverity): string`); every consumer intent restates the exact signatures character-for-character with the producer; workers never invent methods (`agent-core`).

## 4. Pre-emission validation (all must hold; any violation → payload + failed rule to `blackboard/error/`, never queue wrong stage, agent, or dependency)

1. **Schema:** exactly the ten §3 keys (missing or extra → reject); `id` matches the pattern, stage suffix equals `stage`, ordinal equals its post-sort position, unique; `stage` equals `stage_of(path)`; `kind` equals `kind_of(path)` — `kind=ux` only on presentational `ui` paths, never `feature/` containers; `feature` set iff `layer=="features"` and equals the `features/<f>` path segment.
2. **Stage 0:** `agent-container`, `kind=config`, `layer=root`, `feature=null`, empty `dependsOn`, path not under `src/app/`, intent states the exact CLI command incl. `--directory .`.
3. **Ordering:** every `dependsOn` id resolvable and sorting before the task; the §1 `Requires` stages are satisfiable; every `ux` lists its creation id.
4. **`ux` intent:** embeds the full grid (matrix + all region keys incl. `type`/`chart`/`layout`/`content` + every responsive override) and theme tokens — non-empty, never prose-only.
5. **Interface identity:** producer and consumer intents carry identical signatures, character-for-character.
6. **Mappings:** §1/§2 first-match honored; unmatched path or agent → reject.
