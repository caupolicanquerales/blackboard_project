---
name: task-descomposition
description: "Use when the architect agent must decompose an Architecture Plan into task files for blackboard/queue/. Provides the strict execution sequence, universal target-agent mapping by logical role, platform-agnostic companion file rules, and exact task JSON schema. Deterministic decision rules only."
---

# Task Decomposition — Queue Emission (Universal)

One primary source artifact = one **creation** task = `blackboard/queue/<id>.json`. Companion files ride with their primary source task (not separate tasks). A worker may claim a task only when every `dependsOn` id **and** its `Requires` stages (§1) are in `blackboard/complete/`. Task `path`s are relative to the **generated project root** (runner `--output`) — never the blackboard repository root.

## 1. Execution sequence (universal)

- **Stage 0 — bootstrap, only if project native config is missing:** appropriate agent runs platform creation command from project root (as determined by architect). No Requires; synthetic `path` (e.g. `project-bootstrap`); `layer=root`, `feature=null`, `kind=config`, `dependsOn=[]`; emit before stage 1.
- **Presentational/UI components:** may be split into creation + UX refinement depending on platform/skill rules. Follow rules from loaded architect skills.
- **Data bundle:** emit data artifacts (models/types, APIs/data sources, state stores) as needed per platform, respecting dependencies.
- **Provisioning/mocks:** emit platform-appropriate provisioning tasks when needed.

General ordering (adapt by platform): models/types → core/shared → data/state → UI presentational → containers/pages/screens → routing/navigation/config → app bootstrap/config.

Emit sorted by `(stage, path, kind-rank)` ascending; `dependsOn` only to tasks sorting before.

## 2. Universal Target Agent Mapping (by logical role)

Map by **role/concern**, not file extension alone:

| Role/Pattern | `targetAgent` | Notes |
|---|---|---|
| Project bootstrap/init | platform-appropriate agent (e.g., `agent-container` or platform agent) | Stage 0 |
| Routing/navigation configuration | `agent-wiring` | routes, navigation config, app config |
| App entry/bootstrap config | `agent-wiring` | main entry, app configuration |
| Data models/types/interfaces/DTOs | `agent-model` | pure types/models |
| Services/data access/API clients | `agent-core` | business logic, data fetching, API integration |
| State management (stores/redux/vuex/bloc/providers) | `agent-core` | state logic |
| Guards/middleware/interceptors/resolvers | `agent-core` | cross-cutting logic |
| Reusable utilities/pipes/directives/helpers (logic) | `agent-core` or per platform skill | follow loaded skills |
| UI components/screens/widgets (creation/scaffold) | agent responsible for component creation (e.g., `agent-container` or platform component agent) | primary component artifact |
| UI refinement/styling/UX/accessibility/layout application | `agent-ui` | UX tasks, styling, a11y |
| Design system/theme tokens/styles | `agent-ui` | platform styling concerns |

Platform skills/architect may override specific mappings. Always apply first match from loaded rules.

## 3. Platform-agnostic Companion File Rules

**Do not create separate tasks for companions** - they ride with the primary source file task.

- **Web/TS**: `.html`, `.scss`/`.css`, `.spec.ts` ride with `.ts` component/service task.
- **Mobile - Flutter/Dart**: widget files, style/theming fragments, tests (`*_test.dart`) ride with primary `.dart` file.
- **Mobile - React Native**: stylesheets/StyleSheet objects, types, tests ride with primary component file.
- **Native - Swift**: XIB/Storyboard references, extensions, tests ride with primary `.swift` file.
- **Native - Kotlin/Java**: layouts/XML, styles, tests ride with primary source file.
- **Cross-platform**: follow framework conventions from loaded skills; styles, configs, tests, assets declarations ride with primary source.

The task's `path` points to the **primary source artifact**. Workers must create/update companions in the same location/context.

## 4. Task schema (exact)

```json
{
  "id": "T5-002",
  "targetAgent": "agent-ui",
  "stage": 5,
  "dependsOn": ["T5-001"],
  "path": "src/.../component.ext",
  "kind": "<platform-appropriate-kind>",
  "layer": "core|shared|features|layout|root",
  "feature": "name-or-null",
  "export": "PrimaryExportName",
  "intent": "..."
}
```

- `id`: `^T[0-8]-\d{3}$`; middle number = `stage`; ordinal = position after sorting by `(path, kind-rank)`; unique.
- `targetAgent`/`stage`: §§2/1.
- `path`: under project root as appropriate for platform; Stage 0 synthetic if needed.
- `dependsOn`: ids sorting before; `[]` if independent.
- `kind`: platform-appropriate (e.g., model/service/store/component/screen/widget/route/provider/config/ux etc.)
- `layer`: `core|shared|features|layout|root`
- `feature`: name iff `layer=="features"` else `null`
- `export`: primary exported symbol/name

## 5. Verbatim "layoutSpec" Transfer (Universal)

**Critical rule**: For UI tasks (UX refinement tasks and UI component intents that consume layout), transfer the entire `layoutSpec` verbatim from `seed.json`.

- **Layout regions** (`layout/**`): use `global_requirements.layoutSpec` in full
- **Feature UI** (`features/<f>/ui/**`, screens/widgets): use `features[<f>].layoutSpec` in full
- **Always include**: `project.platform`, `project.layoutParadigm`, `project.framework`, and `global_requirements.theme` tokens
- **Preserve structure**: For grid paradigm, keep full grid contract inside `layoutSpec.grid` (display/columns/rows/gap/areas/matrix/regions/responsive). For stack/flexbox/constraints, keep corresponding specs intact.
- **No transformation**: Never re-derive, abbreviate, or hardcode extraction. Never convert between paradigms.
- **Style directives**: Add platform-appropriate style/a11y/template directives after layoutSpec.

## 6. Pre-emission validation

1. **Schema**: required keys present, `id` matches pattern, stage consistent, kinds valid per platform rules.
2. **Stage 0**: correct agent, `kind=config`, proper deps/paths per platform.
3. **Ordering**: deps resolve and sort before, Requires satisfied, consumers depend on producers.
4. **UX/layout intents**: If UI layout task, must include full `layoutSpec` verbatim with paradigm-appropriate structure and theme tokens.
5. **Companions**: No separate tasks for companion files.
6. **Mappings**: Universal role mapping followed or overridden by loaded skills consistently.
