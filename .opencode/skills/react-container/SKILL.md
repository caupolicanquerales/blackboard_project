---
name: react-container
description: "React Native (mobile) specific rules for container/ui component creation and Stage 0 bootstrap using the Expo or React Native CLI. Load dynamically by universal component agents when framework is React Native or a React mobile framework."
---

# React Container Skill

## Stage 0 (React Native bootstrap)
- If missing `package.json` and `app.json` (or `app.config.ts`) in project root, bootstrap with Expo: `npx create-expo-app@latest . --template blank-typescript --yes`
- Must target the project root (`.`) so files land directly in the project root.
- If Expo is not wanted, use the React Native CLI: `npx @react-native-community/cli init <name> --directory . --skip-install`
- Normalize scaffold: ensure `App.tsx` is the root component, remove unused template screens, and keep `index.ts` (or `index.js`) registering the root component with `registerRootComponent`.
- Ensure `tsconfig.json` extends `expo/tsconfig.base.json` (Expo) and `strict` is `true`. Always use the explicit `.json` extension: the file lives at `node_modules/expo/tsconfig.base.json`, and editors do not resolve the extensionless `expo/tsconfig.base` through the package `exports` map.
- Verify before finishing Stage 0: the file named in `extends` exists under `node_modules/` (for example `test -f node_modules/expo/tsconfig.base.json`). If it does not, fix the path; do not remove the `extends` line.
- Test typings: `@testing-library/react-native`, `jest-expo`, and `@types/jest` must be in `devDependencies`. Install any that are missing (`npm install --save-dev @types/jest jest-expo @testing-library/react-native`).
- Add `"types": ["jest"]` to `compilerOptions` in `tsconfig.json`. Without it, `tsc` does not load Jest globals (`describe`, `it`, `expect`, `jest`), and every `.test.tsx` file fails the typecheck.
- Verify before finishing Stage 0: `npx tsc --noEmit` must report no errors in `.test.tsx` files. If it does, fix the typings before continuing; do not delete tests.

## Component scaffolding (React Native)
- Containers and UI components live in `src/components/` (ui) and `src/screens/` (containers).
- Create one folder per component: `src/components/<ComponentName>/index.tsx` plus `<ComponentName>.types.ts` and `<ComponentName>.test.tsx`.
- Component names are PascalCase; file and folder names match the component name.
- Use functional components with TypeScript `type Props = {...}` and `export function ComponentName(props: Props)`. No class components.
- Always create/update the sibling `<ComponentName>.test.tsx` using `@testing-library/react-native`.
- Fix tests for required props or hooks without weakening the public API.
- Keep dependencies ≤ 3 per component, no cross-feature imports.
- Leave UX/styling to agent-ui.

## Container vs presentational
- Containers (screens) own data fetching and navigation hooks (`useNavigation`, `useRoute`) and pass plain props to UI components.
- Presentational (ui) components receive data and callbacks through props only, with no navigation or service calls.
- Shared state is read through custom hooks in `src/hooks/` (for example `useSession()`), never by importing store internals directly.

## Conventions
- Use `FlatList` for lists, `Pressable` for touch targets, `TextInput` for input, and `SafeAreaView` at the screen root.
- Styles use `StyleSheet.create` at the bottom of each component file.
- Avoid DOM elements (`div`, `span`, `button`) and CSS files.
- Do not use `any`; type navigation params with a typed `RootStackParamList`.
