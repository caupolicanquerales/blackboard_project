---
name: react-wiring
description: "React Native and React mobile wiring rules for navigation, providers, app config, and entry points. Load dynamically for React Native or React mobile projects."
---

# React Wiring Skill

- Navigation uses React Navigation navigators; each feature exports its own `<f>.navigator.tsx`, and the root navigator mounts them. No screen imports across features.
- Lazy-load heavy screens with `React.lazy` and `Suspense` only when the architect plan requires it; keep the root navigator declarative.
- Providers are composed in one place (`App.tsx` or `src/app/providers.tsx`) in a fixed order: `SafeAreaProvider`, `NavigationContainer`, state/query providers, then the mock seed provider when present.
- App config (API base URL, feature flags) lives in one `src/core/config.ts` (or `app.json` `extra` for Expo) and is read through that module only.
- Entry point (`index.ts` / `registerRootComponent`) is untouched unless explicitly tasked.
- Native permissions and plugins (camera, location, notifications) are declared only when a task requires them, in `app.json` (Expo) or the native manifests.
- Typed navigation: export `RootStackParamList` from `src/core/navigation/types.ts` and use it in every `useNavigation` and `useRoute` call.
- Wire only declared providers, stores, and navigators; never add an unplanned provider.
