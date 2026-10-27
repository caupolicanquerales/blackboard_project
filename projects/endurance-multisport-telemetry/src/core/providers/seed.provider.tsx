import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/api-client';
import { createMockAdapter } from '../api/mock-api';
import { config } from '../config';
import type { AthleteProfile } from '../models/athlete-profile';
import type { BiometricMetric } from '../models/biometric-metric';
import type { PhaseProgress } from '../models/phase-progress';
import type { TrainingRatio } from '../models/training-ratio';
import type { WorkoutStep } from '../models/workout-step';
import { useAthleteProfileStore } from '../store/athlete-profile.store';
import { useTelemetryStore } from '../store/telemetry.store';
import { useWorkoutStore } from '../store/workout.store';

export interface SeedProviderProps {
  children: ReactNode;
}

const SEED_PROFILE: AthleteProfile = {
  id: 'athlete-001',
  displayName: 'Alex Rivera',
  role: 'ATHLETE',
  avatarUri: 'https://i.pravatar.cc/150?img=12',
  activeSport: 'Cycling',
  weightKg: 72,
  restingHeartRate: 48,
  maxHeartRate: 188,
  ftpWatts: 285,
};

const SEED_METRIC: BiometricMetric = {
  id: 'metric-0',
  heartRate: 142,
  powerOutput: 230,
  cadence: 88,
  trainingLoad: 64,
  updatedAt: new Date().toISOString(),
};

const SEED_RATIOS: TrainingRatio[] = [
  { id: 'ratio-3070', primaryPercentage: 30, secondaryPercentage: 70, categoryLabel: 'Intensity / Base' },
  { id: 'ratio-5050', primaryPercentage: 50, secondaryPercentage: 50, categoryLabel: 'Bike / Run' },
];

const SEED_STEPS: WorkoutStep[] = [
  { id: 'step-01', stepNumber: 1, title: 'STEP 01', description: 'Warm-up spin, easy cadence 90 rpm', targetZone: 'Zone 1', isCompleted: false },
  { id: 'step-02', stepNumber: 2, title: 'STEP 02', description: 'Tempo block 3 x 8 min', targetZone: 'Zone 3', isCompleted: false },
  { id: 'step-03', stepNumber: 3, title: 'STEP 03', description: 'Threshold intervals 4 x 5 min', targetZone: 'Zone 4', isCompleted: false },
  { id: 'step-04', stepNumber: 4, title: 'STEP 04', description: 'Cool-down and mobility', targetZone: 'Zone 1', isCompleted: false },
];

const SEED_PHASES: PhaseProgress[] = [
  { id: 'phase-01', phaseName: 'Warm-up', completionPercentage: 40, status: 'IN_PROGRESS' },
  { id: 'phase-02', phaseName: 'Tempo', completionPercentage: 0, status: 'PENDING' },
  { id: 'phase-03', phaseName: 'Threshold', completionPercentage: 0, status: 'PENDING' },
  { id: 'phase-04', phaseName: 'Cool-down', completionPercentage: 0, status: 'PENDING' },
];

let seeded = false;

// Synchronous so the stores are populated before the first child render.
function seedOnce(): boolean {
  if (!seeded) {
    seeded = true;
    apiClient.setAdapter(createMockAdapter());
    useAthleteProfileStore.setState({ profile: SEED_PROFILE, status: 'success', error: undefined });
    useTelemetryStore.setState({ metric: SEED_METRIC, ratios: SEED_RATIOS, status: 'success' });
    useWorkoutStore.setState({
      routineId: config.DEFAULT_ROUTINE_ID,
      steps: SEED_STEPS,
      phases: SEED_PHASES,
      status: 'success',
      error: undefined,
    });
  }
  return true;
}

export function SeedProvider({ children }: SeedProviderProps): React.JSX.Element {
  useState(seedOnce);
  return <>{children}</>;
}
