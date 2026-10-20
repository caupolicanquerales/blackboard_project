# Blackboard — Multi-Agent Angular Application Generator

> A deterministic, blackboard-pattern orchestrator that turns **one product description** into a
> **fully scaffolded, compiling Angular 22 application** by coordinating seven specialized AI agents
> through a typed, dependency-ordered task queue.

<p>
  <img alt="Python" src="https://img.shields.io/badge/python-3.10%2B-3776AB?logo=python&logoColor=white">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white">
  <img alt="Signals" src="https://img.shields.io/badge/signals-zoneless-2E7D32">
  <img alt="Agents" src="https://img.shields.io/badge/agents-7-6A1B9A">
  <img alt="OpenTelemetry" src="https://img.shields.io/badge/tracing-OpenTelemetry-F5A800?logo=opentelemetry&logoColor=white">
  <img alt="Runtimes" src="https://img.shields.io/badge/runtimes-opencode%20%7C%20Copilot%20CLI-0A66C2">
</p>

---

## What this is

Blackboard is a **code-generation pipeline**, not a chatbot. You describe an application once; the
orchestrator then drives a fleet of narrowly-scoped agents that each own exactly one file, one
layer, and one responsibility. Every hand-off travels through the filesystem as a validated JSON
task, every stage is gated by compilation, and the whole run is observable end-to-end.

The repository ships two interchangeable orchestrators over the **same queue contract**:

| Runner | Backend | Agents live in |
| --- | --- | --- |
| `runner.py` | [`opencode`](https://opencode.ai) CLI | `.opencode/agents/*.md` |
| `runner_github.py` | GitHub Copilot CLI (`copilot`) | `.github/agents/*.agent.md` |

The included reference build produces **Fitness & Trainer Performance Dashboard** — a dark,
high-contrast athletic telemetry SPA with live biometric tiles, comparison bars, radial gauges,
a chevron phase timeline, and a step-by-step workout runner.

---

## Why it's interesting

- **Deterministic, not vibes-based.** Task ordering is computed, not negotiated. Stage `0→8`,
  per-stage `(path, kind-rank)` sort, and a `REQUIRES` dependency matrix decide what runs next.
- **Filesystem as the blackboard.** Agents never talk to each other. They read and write task
  files in `blackboard/`, so the whole run is inspectable, resumable, and reproducible.
- **Compile-gated.** After each task the runner type-checks the output and only then advances a
  task to `complete/`; failures are quarantined in `error/` with the exact reason.
- **Contracts over improvisation.** Producer and consumer tasks carry identical, character-exact
  API signatures in their `intent`, so workers bind to a declared interface instead of guessing.
- **Data-provisioning seam.** When a spec implies remote data with no backend, the architect plans
  an in-memory `HttpInterceptorFn` + seed provider, registered only through `app.config.ts` — a
  removable mock layer, never dead endpoints.

---

## Architecture at a glance

```
                    ┌──────────────────────────────────────────────────────────────┐
   human            │                                                            │
 description  ──▶   │  agent-spec-translator ──▶  seed/<n>_seed.json               │
 (markdown)         │        (prose → explicit CSS-grid + spatial spec)            │
                    │                    │                                        │
                    │                    ▼                                        │
                    │  agent-architect  ──▶  complete/architecture-plan.md        │
                    │        │                 (layer + kind per artifact)        │
                    │        ▼                                                    │
                    │  runner --emit  ──▶  blackboard/queue/T*.json               │
                    └────────────────────┬───────────────────────────────────────┘
                                         │   deterministic claim loop
                                         ▼
        ┌────────────────────────── list of blackboard workers ───────────────────┐
        │  agent-model      (models)                                             │
        │  agent-core       (services · stores · apis · guards · interceptors)    │
        │  agent-container  (bootstrap + component scaffolds)                    │
        │  agent-ui         (ux refinement · pipes · directives)                 │
        │  agent-wiring     (routes · providers · config · main · index.html)    │
        └────────────────────────────────────┬────────────────────────────────────┘
                                             ▼
                             projects/<project-name>/  (Angular 22 app)
```

Each worker is handed **exactly one** task JSON plus the absolute project root, and its success
condition is a single file on disk that implements the task `intent`.

---

## The seven agents

| Agent | Role |
| --- | --- |
| `agent-spec-translator` | Converts a human markdown description into the machine-readable JSON **seed** — including an explicit CSS-grid and spatial spec for the shell, every screen, and every widget. |
| `agent-architect` | Applies the architecture rules to every artifact, writes `architecture-plan.md`, decomposes it into dependency-ordered task JSON, and queues the batch via `--emit`. Never writes app code. |
| `agent-model` | Authors one TypeScript model/type/enum file. No logic, no cross-layer imports. |
| `agent-core` | Authors logic: services, stores, APIs, guards, interceptors, resolvers — signals-first, `inject()`, functional. Generates services/APIs via Angular CLI, then implements. |
| `agent-container` | Executes Stage 0 bootstrap and scaffolds components with Angular CLI, then fills in the functional skeleton (inputs/outputs, injected stores) and keeps specs green. |
| `agent-ui` | Owns UX/UI: applies the explicit grid spec from the intent, modern corporate styling, accessibility, and template design. Also authors pipes/directives. |
| `agent-wiring` | Authors routing (`loadChildren`/`loadComponent`), providers, `app.config.ts`, and the document shell (`main.ts`, `index.html`). |

Tasks parallelize safely because **no two tasks can ever touch the same file**, and the dependency
graph makes illegal orderings impossible — the reference build enqueued 50 tasks across all 9 stages,
all of which now sit in `blackboard/complete/`.

---

## The nine stages

Work is decomposed into nine stages with hard prerequisites:

| Stage | Artifacts | Requires |
| --- | --- | --- |
| `0` | project bootstrap (`ng new … --directory .`) | — |
| `1` | `*.model.ts`, `shared/models/**` | — |
| `2` | `core/**` | 1 |
| `3` | `features/<f>/data/**` (incl. `*.model.ts`) | 1, 2 |
| `4` | rest of `shared/**` | 1 |
| `5` | `features/<f>/ui/**` | 1, 4 |
| `6` | `features/<f>/feature/**` (route targets) | 1, 2, 3, 5 |
| `7` | `features/<f>/<f>.routes.ts`, `layout/**` | 2, 4, 6 |
| `8` | `app.*.ts`, `main.ts`, `index.html` | 7 |

A task is **claimable** only when every `dependsOn` id is in `blackboard/complete/` **and** no task
from a required stage is still sitting in the queue. Presentational components are split into a
**creation** task (`agent-container`) followed by exactly one **ux** task (`agent-ui`), so structure
and styling never race.

---

## The task schema

Every unit of work is a validated JSON document — the contract between orchestrator and worker:

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
  "intent": "Spatial: display=grid; columns=minmax(0,1fr); rows=auto 1fr; gap=1rem; ... Style: modern-corporate tokens, AA contrast, focus-visible, reduced-motion."
}
```

The runner enforces, among other invariants: the id's stage suffix matches `stage`; the `path`
determines `stage`, `targetAgent`, `kind`, and `layer`; a `features` layer requires a matching
`feature`; dependencies must resolve and sort strictly before the task. A single violation fails the
**whole batch** at emit time — you never queue a half-valid plan.

---

## The generated reference app

`projects/fitness-trainer-performance-dashboard/` is a real, working build produced by the pipeline:

- **Angular 22** standalone, signals, zoneless, SCSS, Vitest.
- **Shell** (`layout/`): `trainer-header` banner (hero `trainer-avatar` + headline + nav), a
  standalone `trainer-avatar` component, and a `toast-host` overlay.
- **Feature — Dashboard** (`/dashboard`): `biometric-tiles`, `comparison-split-bars`,
  `radial-gauges`, and a `statistics-bar`.
- **Feature — Routines** (`/routines`): a `chevron-stepper` timeline, `step-card-list`, and a
  `step-detail` panel with complete/advance actions.
- **Shared** (`shared/ui/`): `chevron-stepper`, `step-card-list`, and `icon`.
- **Core** (`core/`): telemetry service (`biometrics/`), toast store (`alerts/`), trainer-profile
  store (`profile/`), a mock HTTP `api/` + interceptor (`mock/`), and dev-seed providers
  (`providers/`) — the Rule 6 data-provisioning seam.
- **Lazy routing**: `app.routes.ts` → `loadChildren` per feature → `loadComponent` per page.

Run it:

```bash
cd projects/fitness-trainer-performance-dashboard
npm install
npm start        # ng serve → http://localhost:4200
npm run build    # production build
```

---

## Quickstart

### 1. Prerequisites

- Python 3.10+
- Node.js + Angular CLI (for the generated project)
- One agent backend: the `opencode` CLI, or the GitHub Copilot CLI (`copilot`)

### 2. Generate an app from a description

```bash
python3 runner.py --translate seed/001_description.md
```

This runs the spec-translator (markdown → `seed/001_seed.json`), then the architect
(seed → plan → queued tasks), then drains the queue stage by stage until the project compiles.

### 3. Or start from an existing seed / inline request

```bash
python3 runner.py --seed seed/001_seed.json
python3 runner.py --architect "Build a dark athletic telemetry dashboard with …"
```

### 4. Drive it with GitHub Copilot instead

```bash
python3 runner_github.py --translate seed/001_description.md --watch
```

### Common flags

| Flag | Purpose |
| --- | --- |
| `--watch` | Poll the queue continuously (re-queue tasks from another terminal). |
| `--output DIR` | Where the Angular project is generated (default `projects/<seed name>`). |
| `--verify {none,typecheck,build}` | Post-task compile gate (default `typecheck`). |
| `--verify-scope {task,global}` | Fail only on the task's own file, or on any project error. |
| `--limit N` | Stop after N tasks. |
| `--no-auto` | Do not auto-approve opencode tool calls. |
| `--emit FILE…` | Validate + enqueue task JSON files and exit (used by the architect). |

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
│   ├── 001_description.md        # human app description (input)
│   └── 001_seed.json             # machine seed with explicit grid specs (architect input)
├── .opencode/                    # opencode agents + skills
│   ├── agents/                   # agent-architect, -spec-translator, -container, -core, -model, -ui, -wiring
│   └── skills/                   # angular-architect, task-descomposition, command-line-executer, writer-file
├── .github/agents/               # mirrored Copilot agent profiles (*.agent.md)
└── projects/
    └── fitness-trainer-performance-dashboard/   # generated Angular 22 application
        └── src/app/                              # core · shared · features/{dashboard,routines} · layout
```

---

## Design decisions

- **Blackboard over message-passing.** Files are durable, greppable, and replayable. A crashed run
  resumes where it stopped; a bad plan is diffable.
- **One file per task.** No merge conflicts between parallel agents, no ambiguity about ownership,
  and trivially parallelizable stages.
- **Deterministic scheduling in the runner.** The LLM never decides *what* runs next — it only
  decides *what the file contains*. Ordering is pure Python.
- **Compile gate as the completion criterion.** A task is "done" only when its file exists **and**
  the project type-checks; otherwise it lands in `error/` with the compiler's exact message.
- **Two runtimes, one contract.** Swapping the agent backend changes neither the queue format nor
  the orchestration logic — a clean separation between *what* to build and *who* builds it.

---

## Observability

`telemetry.py` wires optional OpenTelemetry tracing with zero hard dependencies:

- Spans for `blackboard.architect`, `blackboard.translator`, `blackboard.emit`, `blackboard.agent`,
  `blackboard.verify`, `blackboard.complete`, `blackboard.error`, and `blackboard.queue` — each
  tagged with `task.id`, `task.stage`, `task.kind`, `task.target_agent`, and `task.path`.
- **Disabled by default.** If no endpoint is set or the SDK is absent, every helper is a no-op and
  the runners behave identically.
- Bring up a local collector (Arize Phoenix) and watch the run as a trace tree:

```bash
docker compose -f arize_phoenix.yml up -d
# UI:      http://localhost:6006
# OTLP:    4317 (gRPC) · 4318 (HTTP)
```

Set `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env` (the collector **base** URL — the exporter appends
`/v1/traces` itself; shipped default `http://localhost:6006`). The resource also carries an
`openinference.project.name` attribute so Phoenix groups spans under the service name.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Orchestration | Python 3 (stdlib only — `argparse`, `subprocess`, `threading`, `json`) |
| Agent backends | opencode CLI · GitHub Copilot CLI |
| Generated app | Angular 22, standalone components, signals, zoneless, SCSS, Vitest |
| Observability | OpenTelemetry + Arize Phoenix (optional) |
| Pattern | Blackboard multi-agent, deterministic scheduler, compile-gated stages |

---

## License

No license file is currently included. Add one before distributing or accepting contributions.
