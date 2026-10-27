# Blackboard — Multi-System, Stack-Agnostic App Generator

> A deterministic blackboard-pattern orchestrator that turns **one product description** into a **fully scaffolded, compiling application** for the stack named in that description (Angular, React, React Native/Expo, Flutter, and others as skills are added). Specialized AI agents coordinate through a typed, dependency-ordered task queue on the filesystem.

---

## What this is

Blackboard is a **code-generation pipeline**, not a chatbot. You describe an application once in `seed/<n>_description.md`. The orchestrator then runs a fleet of narrowly-scoped agents that each own exactly one file, one layer, and one responsibility. Every hand-off travels through the filesystem as a validated JSON task, every stage is gated by a compile check for the detected stack, and the whole run is observable end-to-end.

The pipeline is **not tied to one framework**. Nothing in the agents or the runner hard-codes Angular. Instead:

- The **spec translator** reads the `Framework` section of the description and writes `platform`, `layoutParadigm`, `framework`, and `skills[]` into the seed.
- The **architect** and **workers** load the skill named by `project.framework` (for example `react-core`, `angular-ui`). The skill name is `<stack>-<role>`, and the stack is stamped into every task `intent`.
- The **runner** detects the generated project's stack from its config files (see [Verification gate](#verification-gate)) and runs the matching compile check.

The repository ships two interchangeable orchestrators over the **same queue contract**:

| Runner | Backend | Agents live in |
| --- | --- | --- |
| `runner.py` | [`opencode`](https://opencode.ai) CLI | `.opencode/agents/*.md` |
| `runner_github.py` | GitHub Copilot CLI (`copilot`) | `.github/agents/*.agent.md` |

### Reference builds

| Project | Stack | Platform | Location |
| --- | --- | --- | --- |
| Fitness & Trainer Performance Dashboard | Angular 22, standalone, signals, zoneless | Web SPA | `projects/fitness-trainer-performance-dashboard/` |
| Endurance & Multisport Telemetry | React Native + Expo, TypeScript, functional components | Mobile | `projects/endurance-multisport-telemetry/` |

---

## Why it's interesting

- **Deterministic, not vibes-based.** Task ordering is computed, not negotiated. Stage `0→8`, per-stage `(path, kind-rank)` sort, and a `REQUIRES` matrix decide what runs next.
- **Filesystem as the blackboard.** Agents never talk to each other. They read and write task files in `blackboard/`, so the whole run is inspectable, resumable, and reproducible.
- **Compile-gated.** After each task the runner runs the stack's check and only then advances a task to `complete/`. Failures are quarantined in `error/` with the exact reason.
- **Contracts over improvisation.** Producer and consumer tasks carry identical, character-exact API signatures in their `intent`, so workers bind to a declared interface instead of guessing.
- **Platform-adaptive layout.** Web specs use CSS Grid. Mobile specs use `stack`, `flex`, or `constraints` layouts. The seed carries the layout spec verbatim into UI tasks.
- **Data-provisioning seam.** When a spec implies remote data with no backend, the architect plans a removable in-memory mock layer (for example an `HttpInterceptorFn` in Angular, or a seed provider in React), registered only through the app's configuration entry point.

---

## Architecture at a glance

```
  human description (markdown)
          │
          ▼
  agent-spec-translator ──▶ seed/<n>_seed.json
          │                  (platform, layoutParadigm, framework, skills[], layoutSpec)
          ▼
  agent-architect ──▶ blackboard/complete/architecture-plan.md
          │            (layer + kind per artifact, framework stamp per task)
          ▼
  runner --emit ──▶ blackboard/queue/T*.json
          │
          ▼   deterministic claim loop
  ┌──────────────────────── stack-agnostic workers ────────────────────────┐
  │  agent-model      (models / types)                                     │
  │  agent-core       (services · stores · APIs · guards · interceptors)   │
  │  agent-container  (bootstrap + component scaffolds)                    │
  │  agent-ui         (UX refinement · pipes · directives · styling)       │
  │  agent-wiring     (routes · providers · config · entry points)         │
  └────────────────────────────────────────────────────────────────────────┘
          │   each worker loads <stack>-<role> from the task framework stamp
          ▼
  projects/<project-name>/   (generated app for the chosen stack)
```

Each worker is handed **exactly one** task JSON plus the absolute project root. Its success condition is a single file on disk that implements the task `intent`.

---

## The agents

| Agent | Role |
| --- | --- |
| `agent-spec-translator` | Converts a human markdown description into the machine-readable JSON **seed**. Detects platform and framework, sets `skills[]`, and writes the explicit layout spec for the shell, screens, and widgets. |
| `agent-architect` | Loads `task-descomposition` and the `<stack>-architect` skill, writes `architecture-plan.md`, decomposes it into dependency-ordered task JSON, and queues the batch via `--emit`. Never writes app code. |
| `agent-model` | Authors one model, type, or enum file. No logic, no cross-layer imports. Loads `<stack>-model` (or `typescript-model`). |
| `agent-core` | Authors logic: services, stores, APIs, guards, interceptors, resolvers. Signals-first or hooks-first, depending on the stack. Loads `<stack>-core`. |
| `agent-container` | Executes Stage 0 bootstrap and scaffolds components with the stack's CLI or official template, then fills in the functional skeleton. Loads `<stack>-container`. |
| `agent-ui` | Owns UX/UI: applies the layout spec from the intent, modern styling, accessibility, and template or screen design. Loads `<stack>-ui`. |
| `agent-wiring` | Authors routing, providers, configuration, and the app entry points. Loads `<stack>-wiring`. |

Tasks parallelize safely because **no two tasks can touch the same file**, and the dependency graph makes illegal orderings impossible.

### Stack skills

Skills live in `.opencode/skills/` (canonical; `.github/skills` is a symlink to it). Each stack provides one skill per role.

| Stack | Skills |
| --- | --- |
| Angular | `angular-architect`, `angular-translator`, `angular-model`, `angular-core`, `angular-container`, `angular-ui`, `angular-wiring` |
| React / React Native | `react-architect`, `react-translator`, `react-model`, `react-core`, `react-container`, `react-ui`, `react-wiring` |
| Language-level | `typescript-model` |
| Universal | `task-descomposition`, `writer-file`, `command-line-executer` |

To support a new stack, add the matching `<stack>-<role>` skills. The agent profiles do not change.

---

## The nine stages

Work is decomposed into nine stages with hard prerequisites. The stage meaning is stack-neutral. The concrete paths come from the loaded stack skill.

| Stage | Artifacts | Requires |
| --- | --- | --- |
| `0` | project bootstrap (official CLI or template, run in the generated project root) | — |
| `1` | models, types, enums | — |
| `2` | core logic (services, stores, API clients, guards, interceptors) | 1 |
| `3` | feature data layer (incl. feature models) | 1, 2 |
| `4` | rest of shared code (shared UI, shared utilities) | 1 |
| `5` | feature UI (presentational components, screens' building blocks) | 1, 4 |
| `6` | feature screens or pages (route targets) | 1, 2, 3, 5 |
| `7` | routing, layout or navigation shell, feature route registration | 2, 4, 6 |
| `8` | app entry point, root configuration, document shell | 7 |

A task is **claimable** only when every `dependsOn` id is in `blackboard/complete/` **and** no task from a required stage is still in the queue. Presentational components are split into a **creation** task (`agent-container`) followed by exactly one **ux** task (`agent-ui`), so structure and styling never race.

---

## The task schema

Every unit of work is a validated JSON document, the contract between orchestrator and worker. The `intent` begins with the framework stamp.

```json
{
  "id": "T5-002",
  "targetAgent": "agent-ui",
  "stage": 5,
  "dependsOn": ["T5-001"],
  "path": "src/features/orders/ui/orders-table.component.ts",
  "kind": "ux",
  "layer": "features",
  "feature": "orders",
  "export": "OrdersTableComponent",
  "intent": "framework=angular; platform=web; skill=angular-ui; Spatial: display=grid; columns=minmax(0,1fr); rows=auto 1fr; gap=1rem; ... Style: modern-corporate tokens, AA contrast, focus-visible, reduced-motion."
}
```

The runner enforces, among other invariants:

- The id's stage suffix matches `stage`.
- The `path` determines `stage`, `targetAgent`, `kind`, and `layer`.
- A `features` layer requires a matching `feature`.
- Dependencies must resolve and sort strictly before the task.
- Every `intent` carries the `framework=…; platform=…; skill=<stack>-<role>;` stamp.
- Task files must not contain stale runtime keys such as `error`. A file with an extra key is rejected with `schema mismatch`, and it returns to `error/`.

A single violation fails the **whole batch** at emit time, so a half-valid plan is never queued.

---

## Verification gate

After each task the runner detects the stack from config files in the generated project root and runs the matching check. The check is selected by the first marker found, in this order:

| Marker file | Stack | `typecheck` (default) | `build` |
| --- | --- | --- | --- |
| `pubspec.yaml` | Flutter | `flutter analyze` | `flutter build bundle` |
| `angular.json` | Angular | `npx tsc --noEmit` | `npx ng build --configuration development` |
| `package.json` + `tsconfig*.json` | React, React Native, other TypeScript/JS | `npx tsc --noEmit` | `npm run build` |
| `package.json` (no tsconfig) | Plain JavaScript | none | `npm run build` |
| `go.mod` | Go | `go vet ./...` | `go build ./...` |
| `Cargo.toml` | Rust | `cargo check` | `cargo build` |
| `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt` | Python | `compileall` | `compileall` |

If no marker matches, or `--verify none` is set, the gate is skipped.

Test typings are part of the gate. Test files that use Jest globals (`describe`, `it`, `expect`) need `types: ["jest"]` in `tsconfig.json`, and the matching `@types/jest` package in `devDependencies`. Without them `tsc --noEmit` fails on every task.

When a config file uses a package `exports` path, prefer an explicit file path, for example `expo/tsconfig.base.json`. Editors and the CLI resolve `exports` differently.

---

## The generated reference apps

### Fitness & Trainer Performance Dashboard (Angular 22, web)

`projects/fitness-trainer-performance-dashboard/` is a working build produced by the pipeline.

- **Angular 22** standalone, signals, zoneless, SCSS, Vitest.
- **Shell** (`layout/`): `trainer-header` banner, a standalone `trainer-avatar`, and a `toast-host` overlay.
- **Feature: Dashboard** (`/dashboard`): `biometric-tiles`, `comparison-split-bars`, `radial-gauges`, and `statistics-bar`.
- **Feature: Routines** (`/routines`): a `chevron-stepper` timeline, `step-card-list`, and a `step-detail` panel.
- **Shared** (`shared/ui/`): `chevron-stepper`, `step-card-list`, and `icon`.
- **Core** (`core/`): telemetry service, toast store, trainer-profile store, mock HTTP `api/` with interceptor, and dev-seed providers.
- **Lazy routing**: `app.routes.ts` → `loadChildren` per feature → `loadComponent` per page.

```bash
cd projects/fitness-trainer-performance-dashboard
npm install
npm start        # ng serve → http://localhost:4200
npm run build
```

### Endurance & Multisport Telemetry (React Native + Expo, mobile)

`projects/endurance-multisport-telemetry/` is a mobile build driven by `seed/002_description.md` and `seed/002_seed.json`.

- **React Native + Expo**, TypeScript, functional components, React Navigation 7, zustand 5.
- **Layout**: vertical stack and flexbox with safe-area bounds. There is no CSS Grid on mobile.
- **Navigation**: bottom tabs (Dashboard, Routines, Profile) with stack screens for workout details and active execution.
- **Testing**: `jest-expo` and `@testing-library/react-native`. `tsconfig.json` extends `expo/tsconfig.base.json` and sets `types: ["jest"]`.
- **Status**: the Expo template `App.tsx` and `index.ts` remain until the stage 8 entry-point task replaces them.

```bash
cd projects/endurance-multisport-telemetry
npm install
npx expo start
npx tsc --noEmit
```

---

## Quickstart

### 1. Prerequisites

- Python 3.10+
- The toolchain for the target stack (for example Node.js for Angular, React, or Expo; Flutter SDK for Flutter)
- One agent backend: the `opencode` CLI, or the GitHub Copilot CLI (`copilot`)

### 2. Describe the app

Create `seed/<n>_description.md`. Include a `## Framework` section that names the stack, for example:

```markdown
## Framework
React Mobile (Expo, TypeScript, Functional Components)
```

### 3. Generate an app from the description

```bash
python3 runner.py --translate seed/001_description.md
```

This runs the spec translator (markdown → `seed/001_seed.json`), then the architect (seed → plan → queued tasks), then drains the queue stage by stage until the project passes its verification gate.

### 4. Or start from an existing seed or inline request

```bash
python3 runner.py --seed seed/001_seed.json
python3 runner.py --architect "Build a dark athletic telemetry dashboard with …"
```

### 5. Drive it with GitHub Copilot instead

```bash
python3 runner_github.py --translate seed/002_description.md --watch
```

### Common flags

| Flag | Purpose |
| --- | --- |
| `--watch` | Poll the queue continuously. Use it to re-queue tasks from another terminal. |
| `--output DIR` | Where the generated project is written (default `projects/<seed name>`). |
| `--verify {none,typecheck,build}` | Post-task gate (default `typecheck`). Stack is auto-detected. |
| `--verify-scope {task,global}` | Fail only on the task's own file, or on any project error. |
| `--limit N` | Stop after N tasks. |
| `--no-auto` | Do not auto-approve opencode tool calls. |
| `--emit FILE…` | Validate and enqueue task JSON files, then exit (used by the architect). |

### Recovering failed tasks

Tasks that fail land in `blackboard/error/` with the reason. To retry:

1. Fix the cause (for example the tsconfig typings or the skill rule).
2. Remove any stale runtime keys such as `error` from the task JSON.
3. Move the file back: `mv blackboard/error/<id>.json blackboard/queue/`.

---

## Repository layout

```
.
├── runner.py                     # opencode orchestrator (validate · schedule · verify)
├── runner_github.py              # GitHub Copilot CLI orchestrator (same queue contract)
├── telemetry.py                  # optional OpenTelemetry tracing (no-op when unconfigured)
├── .env                          # OTLP endpoint + service name (endpoint never hardcoded)
├── arize_phoenix.yml             # local Arize Phoenix collector for traces
├── blackboard/
│   ├── queue/                    # pending task JSON
│   ├── complete/                 # finished tasks + architecture-plan.md
│   └── error/                    # quarantined tasks with failure reason
├── seed/
│   ├── 001_description.md        # human application description (input)
│   ├── 001_seed.json             # machine seed (architect input)
│   ├── 002_description.md        # second application description (mobile example)
│   └── 002_seed.json
├── .opencode/
│   ├── agents/                   # agent-architect, -spec-translator, -container, -core, -model, -ui, -wiring
│   └── skills/                   # <stack>-<role> skills, typescript-model, task-descomposition, writer-file, command-line-executer
├── .github/
│   ├── agents/                   # mirrored Copilot agent profiles (*.agent.md)
│   └── skills                    # symlink to .opencode/skills
└── projects/
    ├── fitness-trainer-performance-dashboard/   # generated Angular 22 web app
    └── endurance-multisport-telemetry/          # generated React Native + Expo app
```

Keep `.github/agents/` and `.opencode/agents/` identical. Edit both together.

---

## Design decisions

- **Blackboard over message-passing.** Files are durable, greppable, and replayable. A crashed run resumes where it stopped, and a bad plan is diffable.
- **One file per task.** No merge conflicts between parallel agents, and ownership is unambiguous.
- **Deterministic scheduling in the runner.** The LLM never decides *what* runs next. It only decides *what the file contains*.
- **Stack by skill, not by agent.** Agents are generic. The stack lives in the skills and the framework stamp, so adding a stack does not change the orchestration.
- **Compile gate as the completion criterion.** A task is done only when its file exists and the project passes the stack's check. Otherwise it lands in `error/` with the exact message.
- **Two runtimes, one contract.** Swapping the agent backend changes neither the queue format nor the orchestration logic.

---

## Observability

`telemetry.py` wires optional OpenTelemetry tracing with no hard dependencies:

- Spans for `blackboard.architect`, `blackboard.translator`, `blackboard.emit`, `blackboard.agent`, `blackboard.verify`, `blackboard.complete`, `blackboard.error`, and `blackboard.queue`. Each is tagged with `task.id`, `task.stage`, `task.kind`, `task.target_agent`, and `task.path`.
- **Disabled by default.** Without an endpoint or the SDK, every helper is a no-op.

```bash
docker compose -f arize_phoenix.yml up -d
# UI:      http://localhost:6006
# OTLP:    4317 (gRPC) · 4318 (HTTP)
```

Set `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env` to the collector base URL. The exporter appends `/v1/traces`. The shipped default is `http://localhost:6006`. The resource carries an `openinference.project.name` attribute so Phoenix groups spans under the service name.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Orchestration | Python 3 (stdlib only: `argparse`, `subprocess`, `threading`, `json`) |
| Agent backends | opencode CLI · GitHub Copilot CLI |
| Generated apps | Any stack with a `<stack>-<role>` skill set. Current: Angular 22 (web), React Native + Expo (mobile) |
| Verification | Auto-detected per stack: `tsc`, `ng build`, `npm run build`, `flutter`, `go`, `cargo`, `compileall` |
| Observability | OpenTelemetry + Arize Phoenix (optional) |
| Pattern | Blackboard multi-agent, deterministic scheduler, compile-gated stages |

---

## License

No license file is currently included. Add one before distributing or accepting contributions.
