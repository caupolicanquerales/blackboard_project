---
name: react-ui
description: "React Native and React mobile UX/UI rules for applying layoutSpec (Flexbox and responsive grids) and the design system, covering both mobile app and responsive web experiences. Load dynamically by universal UI agent when framework is React Native or a React mobile framework."
---

# React UI Skill

## Layout implementation (mobile)
- Apply `layoutSpec` as Flexbox: the screen root is `flex: 1`, regions are `View`s with `flexDirection`, `flex`, `justifyContent`, and `alignItems`
- Express spacing with `gap`, `padding`, and `margin` from the design tokens, not hard-coded values
- Use `SafeAreaView` (or `useSafeAreaInsets`) so content clears notches and home indicators
- Keep the thumb zone in mind: primary actions go at the bottom of the screen, and touch targets are at least 44x44 points
- Use `ScrollView` for short content and `FlatList` for long lists; never nest a `FlatList` inside a `ScrollView` of the same axis
- Use `KeyboardAvoidingView` on screens with `TextInput`; set `keyboardShouldPersistTaps="handled"` on scrollable forms

## Layout implementation (responsive web)
- When the target is a web app (React DOM or React Native for Web), apply `layoutSpec.grid` as CSS Grid: `display: grid`, `grid-template-columns/rows/areas`, and `grid-area` per region
- Use `minmax(0, 1fr)` and prevent overflow with `min-width: 0`
- Use `@media` breakpoints for responsive overrides: mobile first, then tablet (`768px`) and desktop (`1024px`)
- Collapse multi-column regions into a single stacked column on mobile widths

## Responsive strategy
- Use `useWindowDimensions()` to switch between compact (phone), medium (tablet), and expanded (desktop) layouts
- Prefer percentage or `flex` sizing over fixed pixel widths
- Support portrait and landscape; avoid locking orientation unless the description requires it
- Respect the system font scale: do not set fixed heights on text containers

## Mobile UX patterns
- Navigation: use a bottom tab bar for 3 to 5 top-level sections, a stack for drill-down flows, and a drawer only for secondary sections
- Feedback: show loading with skeleton views or `ActivityIndicator`; show errors inline near the field or as a banner, and offer a retry action
- Gestures: use pull-to-refresh (`RefreshControl`) on lists; avoid gesture-only actions without a visible control
- Forms: one primary input per visual group, correct `keyboardType`, `returnKeyType`, and `autoComplete`; validate on blur and on submit
- Empty states: always provide a message and a next action
- Motion: keep animations under 300 ms and respect reduced-motion settings

## Web UX patterns (when the target is a web app)
- Navigation: a persistent header or sidebar on desktop, collapsing to a hamburger menu on mobile widths
- Focus: all interactive elements are reachable by keyboard, with visible focus rings
- Forms: label every input, show validation messages next to the field, and disable submit only while a request is in flight
- Hover states supplement, never replace, focus and pressed states

## Accessibility (both targets)
- Set `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` on every touchable (`Pressable`) and on images
- Maintain color contrast of at least 4.5:1 for body text and 3:1 for large text
- Never rely on color alone to convey status; pair it with text or an icon
- Support screen readers: group related content with `accessible` and order focus logically

## Design tokens and theme
- Apply design tokens from the shared theme object (`src/theme/`) as values, not as literals in each component
- `global_requirements.theme` is passed through unchanged; map `mode` to light or dark palettes and `accent` to the primary color
- Support dark mode through `useColorScheme()` when the theme mode is `system`

## React Native specifics
- Edit `.tsx` files and `StyleSheet.create` styles; keep props and handlers intact
- Never create files for UX that were not assigned
- Keep `export` names and prop types unchanged so other tasks continue to compile
- Do not use DOM-only elements (`div`, `span`, `button`) in mobile code

## Root component adaptation (Stage 0/Stage 8)
- After Stage 0 normalization, `App.tsx` is the single root component
- For root component tasks, replace the starter template markup with the product shell from the seed or `layoutSpec`
- Never create a second root or edit the native entry (`index.ts`, `android/`, `ios/`) unless explicitly tasked
