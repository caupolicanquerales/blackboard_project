---
name: react-core
description: "React Native (mobile) specific rules for services/apis/stores/guards/interceptors/resolvers. Load dynamically by universal core agents when framework is React Native or a React mobile framework."
---

# React Core Skill

## Generation strategy
- `service`/`api`: create plain TypeScript modules in `src/core/services/` or `src/core/api/`. Export typed functions or a class with typed methods. No framework decorators.
- `store`: use Zustand (or Redux Toolkit if the project already uses it) in `src/core/store/` or `src/features/<f>/data/`. Export a typed hook (`useXStore`) built with `create<State>()`.
- `guard`: implement as a navigation-level check. Use a hook (`useAuthGuard`) or a wrapper component that reads auth state and returns `<Redirect>` or navigates with React Navigation `navigation.reset`. Place in `src/core/navigation/`.
- `interceptor`: implement as a request wrapper in the API client (`src/core/api/client.ts`) that adds headers, handles 401s, and logs errors. Use `fetch` or Axios instances; do not use Angular-style interceptor APIs.
- `resolver`: replace with a data hook (`useXData`) that loads data in `useEffect` or via TanStack Query (`useQuery`) and returns `{ data, error, isLoading }`.
- Use `useState`, `useReducer`, `useContext`, and custom hooks for local state. Use `useMemo` and `useCallback` only where a measurable need exists.

## Rules
- Respect layers: `core` is app-wide (API client, auth, global store); `features/<f>/data` is feature-local.
- Never create undeclared files or duplicate types. Shared types live in one `models/` file and are imported everywhere else.
- Verify dependencies exist in `package.json` or use the exact API from intent. Do not invent packages.
- Method names and signatures must match exactly.
- Never import React Native UI components (`View`, `Text`) into services or stores. Core modules stay UI-free.
- Keep async side effects out of render; perform them in `useEffect` with cleanup or in store actions.
- Type every API response and store state with TypeScript interfaces; do not use `any`.
