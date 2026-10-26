---
name: angular-core
description: "Angular-specific rules for services/apis/stores/guards/interceptors/resolvers. Load dynamically by universal core agents when framework is Angular."
---

# Angular Core Skill

## Generation strategy
- `service`/`api`: use Angular CLI with `--type=service` or `--type=api` to scaffold, then implement
- `store`/`guard`/`interceptor`/`resolver`: generate from scratch with Angular patterns
- Use `inject()`, signals (`signal()`, `computed()`), functional guards/interceptors/resolvers
- `providedIn: 'root'` or feature scope as appropriate

## Rules
- Respect layers (core app-wide, feature data local)
- Never create undeclared files or duplicate types
- Verify dependencies exist on disk or use exact API from intent
- Method names/signatures must match exactly
