# Endurance & Multisport Telemetry Mobile App

## Framework
React Mobile (Expo, TypeScript, Functional Components)

## Executive Summary

We need a high-performance, athletic telemetry mobile application called Endurance & Multisport Telemetry. Designed for endurance athletes, triathletes, and personal coaches, the mobile app provides a high-contrast dark UI for tracking real-time biometric metrics, multi-sport workout routines, transition phase progression, and step-by-step workout execution on mobile devices.

## App Shell & Visual Identity

### Visual Style

- High-contrast dark theme with a background of `#121212`
- Neon orange/red accent (`#FF3B30`)
- Bold italic headers and athletic typography
- Custom icon system using native vector icons

### Navigation Shell

- Bottom Tab Navigation for core sections (Dashboard, Routines, Profile)
- Top Safe Area Header displaying athlete avatar header, title "ENDURANCE TELEMETRY", and quick action buttons
- Stack navigation for drill-down workout details and active execution screens

### Layout Regions

The mobile application layout utilizes a vertical stack flexbox system with safe area bounds:

- Top-level biometric status cards (Heart Rate, Power/Cadence, Respiratory)
- Dual comparison training load split bars
- Dual radial progress rings for workout targets
- Horizontal 4-step phase stepper timeline
- Vertical scrollable exercise and interval cards
- Persistent bottom action bar for workout controls

### Accessibility & Mobile Spec

- Touch targets at least 44x44 points for high-precision interactions during workouts
- Full accessibility support via `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` for radial gauges and progress bars
- Dynamic layout scaling using `useWindowDimensions` supporting compact (phone) and medium (tablet/landscape) viewports
- Native safe area handling via `SafeAreaView`

## Global Shell Requirements & Services

### 1. Core Services

- Biometric Telemetry Service: Ingests live streams for heart rate (bpm), power output (watts), cadence (rpm), and training load/stress scores.
- Toast & Notification Store: Displays real-time banner alerts when heart rate or power exceeds target zones or when intervals transition.
- Auth & Athlete Profile Store: Manages current athlete/coach session profile, user metrics, and avatar media.

### 2. Shared UI Components

- Athlete Header Banner: Displays hero athlete avatar, headline title, active sport indicator, and quick sync action buttons.
- Biometric Telemetry Cards: Icon-driven status cards featuring heart rate (heart icon), power output (lightning icon), and cadence (pedal/runner icon) with detail labels.
- Comparison Split Bars: Horizontal data progress bars displaying percentage splits (for example, 30%/70% vs 50%/50% comparative training stress).
- Radial Gauge Indicator: Dual circular progress rings showing target completion percentages (for example, 80% target load and 20% interval progress) with centered metrics.
- Horizontal Stepper Timeline: 4-stage horizontal arrow progress bar (STEP 01 through STEP 04) representing workout sequence phases.
- Interval Exercise Cards: Stacked vertical cards displaying sequential workout instructions and interval targets (STEP 01, STEP 02).
- Live Telemetry Statistics Bar: Dual-layered horizontal statistics meter for real-time intensity output.

## Features & UX Specifications

### 1. Performance Telemetry Dashboard (dashboard)

**Description:**

Real-time athletic monitoring summary displaying athlete profile, live biometric streams, comparative training split ratios, circular completion rings, workout phase progress, and exercise step lists.

**UX Spec:**

- Views: dashboard summary flexbox stack
- States: loading | empty | error | success
- Feedback: banner toast on zone threshold overflow or sensor disconnect
- A11y: high contrast, `accessibilityValue` on radial gauges and progress meters
- Mobile UX: vertical scroll container with pull-to-refresh (`RefreshControl`), bottom thumb-zone primary action controls

**Entities:**

- `BiometricMetric`: `id: string`, `heartRate: number`, `powerOutput: number`, `cadence: number`, `trainingLoad: number`, `updatedAt: string`
- `TrainingRatio`: `id: string`, `primaryPercentage: number`, `secondaryPercentage: number`, `categoryLabel: string`

**Actions:**

- Fetch current telemetry snapshot
- Stream live biometric telemetry updates
- Reset comparative metrics

### 2. Workout Progression & Routines (routines)

**Description:**

Workout execution feature where athletes view and track multi-phase training sessions (STEP 01 to STEP 04) and execute detailed step-by-step exercise and interval routines.

**UX Spec:**

- Views: list, detail, stepper view
- States: loading | empty | error | success
- Feedback: inline completion checkmarks, haptic feedback on interval completion, phase transition alerts
- A11y: screen reader focusable step cards, minimum 44x44pt touch controls
- Mobile UX: `FlatList` virtualized rendering for long interval lists, sticky bottom execution control bar

**Entities:**

- `WorkoutStep`: `id: string`, `stepNumber: number`, `title: string`, `description: string`, `targetZone: string`, `isCompleted: boolean`
- `PhaseProgress`: `id: string`, `phaseName: string`, `completionPercentage: number`, `status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'`

**Actions:**

- Fetch workout steps by routine ID
- Mark step as completed
- Advance to next workout phase