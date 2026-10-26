# Fitness & Trainer Performance Dashboard

## Framework
Angular

## Executive Summary

We need a high-impact, athletic performance and telemetry web application called Fitness & Trainer Performance Dashboard. Designed for personal trainers, endurance athletes, and fitness enthusiasts, the dashboard provides a high-contrast dark UI for tracking real-time biometric metrics, workout completion ratios, phase progression, and step-by-step exercise execution.

## App Shell & Visual Identity

### Visual Style

- High-contrast dark theme with a background of `#121212`
- Neon orange/red accents
- Bold italic headings
- Custom iconography

### Header Shell

- Displays trainer/athlete photo header
- Headline banner: "PERSONAL TRAINER"
- Website URL
- Primary navigation arrow controls

### Layout Regions

The dashboard includes a multi-column grid with:

- Top-level biometric tiles
- Dual comparison data bars
- Dual radial progress gauges
- A 4-step horizontal process timeline
- Vertical exercise instruction cards
- A bottom statistics bar

### Accessibility & Responsive Spec

- Fully accessible ARIA labels for screen readers across all radial gauges and percentage bars
- High contrast ratio compliance
- Fluid grid scaling across desktop and tablet views

## Global Shell Requirements & Services

### 1. Core Services

- Biometric Telemetry Service: Ingests live streams for heart rate (bpm), respiratory/lung capacity, and training load/weight volume.
- Toast & Notification Store: Displays real-time alerts when biometrics exceed zone thresholds or when exercise steps are completed.
- Auth & Trainer Profile Store: Manages current trainer/athlete session profiles and avatar media.

### 2. Shared UI Components

- Trainer Header Banner: Displays hero athlete avatar, headline title, web link, and quick action arrows.
- Biometric Telemetry Tiles: Icon-driven status cards featuring heart rate (heart icon), respiratory rate (lungs icon), and weight volume (dumbbell icon) with accompanying detail labels.
- Comparison Split Bars: Horizontal data progress bars displaying percentage splits (for example, 30%/70% vs 50%/50% comparative training load).
- Radial Gauge Indicator: Dual circular progress rings showing target progress percentages (for example, 80% and 20% completion) with centered step labels.
- Chevron Stepper Timeline: 4-stage horizontal arrow progress bar (STEP 01 through STEP 04) representing workout sequence phases.
- Exercise Step Cards: Stacked vertical cards displaying sequential workout instructions (STEP 01, STEP 02).
- Statistics Bar Widget: Dual-layered horizontal statistics meter for live workout intensity output.

## Features & UX Specifications

### 1. Performance Telemetry Dashboard (/dashboard)

**Description:**

Real-time athletic monitoring summary displaying trainer profile, live health biometrics, comparative training split ratios, circular completion rings, workout phase progress, and exercise step lists.

**UX Spec:**

- Views: dashboard summary grid
- States: loading | empty | error | success
- Feedback: toast alert on threshold overflow
- A11y: high contrast, `aria-valuenow` on radial gauges
- Responsive: 3-column desktop layout, single-column mobile stack

**Entities:**

- `BiometricMetric`: `id: string`, `heartRate: number`, `respiratoryRate: number`, `trainingLoad: number`, `updatedAt: string`
- `TrainingRatio`: `id: string`, `primaryPercentage: number`, `secondaryPercentage: number`, `categoryLabel: string`

**Actions:**

- Fetch current telemetry snapshot
- Stream live heart rate and respiration updates
- Reset comparative metrics

### 2. Workout Progression & Routines (/routines)

**Description:**

Workout execution feature where users view and track multi-phase training sessions (STEP 01 to STEP 04) and execute detailed step-by-step exercise routines.

**UX Spec:**

- Views: list, detail, stepper view
- States: loading | empty | error | success
- Feedback: inline completion checkmarks and phase transition feedback
- A11y: keyboard focusable step cards
- Responsive: stacked card layout on smaller screens

**Entities:**

- `WorkoutStep`: `id: string`, `stepNumber: number`, `title: string`, `description: string`, `isCompleted: boolean`
- `PhaseProgress`: `id: string`, `phaseName: string`, `completionPercentage: number`, `status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'`

**Actions:**

- Fetch workout steps by routine ID
- Mark step as completed
- Advance to next workout phase
