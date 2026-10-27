---
name: react-translator
description: "React Native (mobile) specific rules for translating descriptions into the blackboard seed contract. Contains React Native target defaults, screen-to-component mapping conventions, and the seed schema details for React Native with TypeScript, hooks, and Expo-style project layout. Load dynamically by the universal spec translator when target framework is React Native or a React mobile framework."
---

# React Translator Skill

## Default target
- When the description does not specify a stack, use `"target": "React Native (TypeScript, Functional Components, Hooks)"`.
- When generating project context, prefer kebab-case for `project.name`.

## React Native blackboard integration
- The seed is consumed by the React Native architect and task decomposition pipeline which assumes a React Native project structure under `src/` (screens, components, navigation, hooks, services).
- `target` must describe React Native with functional components and hooks when using the React Native pipeline.
- Do not use DOM-only elements (`div`, `span`, `img`, `input`) or CSS files in the seed. Use React Native primitives (`View`, `Text`, `Image`, `TextInput`, `Pressable`, `ScrollView`, `FlatList`).

## Shared UI mappings (React Native-oriented)
- Reusable UI pieces are functional components placed in `src/components/`.
- Full-page views are screens placed in `src/screens/` and registered in a navigator.
- Lists of items use `FlatList` or `SectionList`, never `map` inside a `ScrollView` for long data.
- Widget types map to presentational components (`src/components/`) and containers/screens (`src/screens/`).
- The `shared_ui` entries describe reusable components with their layout expressed as Flexbox (`flexDirection`, `flex`, `justifyContent`, `alignItems`, `gap`).

## Layout to React Native mapping
- Each region becomes a `View` section inside a screen.
- Shell layout maps to a root navigator (stack, tab, or drawer) in `App.tsx` or `src/navigation/`.
- Feature regions map to screen components.
- Grid-like layouts (CSS Grid in the description) are expressed with Flexbox rows and columns or with `FlatList` with `numColumns`.
- Responsive sizing uses `Dimensions` or `useWindowDimensions`, and percentages in `flex` or `width`. Avoid fixed pixel widths for full-screen containers.
- Safe areas are handled with `SafeAreaView` from `react-native-safe-area-context` for the root screen.

## Navigation
- Use React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`) for routing.
- Route names are declared as typed param lists (`type RootStackParamList = {...}`).
- Lazy-loaded screens are not required; keep navigation declarative.

## State and data
- Local state uses `useState` and `useReducer`. Shared state uses Context or a store (Zustand or Redux Toolkit) if the description requires it.
- Async data uses `useEffect` with cleanup, or a data library such as TanStack Query when the description mentions caching or refetching.
- Network services live in `src/services/`, typed with TypeScript interfaces.

## Styling
- Use `StyleSheet.create` for styles. Do not use CSS files or styled-components unless the description asks for them.
- `global_requirements.theme` is passed verbatim to `agent-ui`. Map its `mode`, `background`, and `accent` to a shared theme object in `src/theme/`.
- Default theme if unspecified: `{"mode": "light", "background": "#ffffff", "accent": "neutral", "headingStyle": "regular"}` (the spec translator's defaults take precedence as written).

## Platform considerations
- Target both iOS and Android unless the description says otherwise.
- Touch targets should be at least 44x44 points.
- Use `Platform.select` only when a platform-specific difference is required.
