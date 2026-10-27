import { ApiError } from './api-client';
import type { ApiTransportAdapter, HttpMethod, Unsubscribe } from './api-client';
import type { AthleteProfile } from '../models/athlete-profile';
import type { BiometricMetric } from '../models/biometric-metric';
import type { PhaseProgress } from '../models/phase-progress';
import type { TrainingRatio } from '../models/training-ratio';
import type { WorkoutStep } from '../models/workout-step';

// core/config does not exist yet; local zone limits used to trigger threshold toasts.
const HEART_RATE_LIMIT = 175;
const POWER_LIMIT = 320;
const STREAM_INTERVAL_MS = 1000;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const PROFILE: AthleteProfile = {
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

const DEFAULT_RATIOS: TrainingRatio[] = [
  { id: 'ratio-3070', primaryPercentage: 30, secondaryPercentage: 70, categoryLabel: 'Intensity / Base' },
  { id: 'ratio-5050', primaryPercentage: 50, secondaryPercentage: 50, categoryLabel: 'Bike / Run' },
];

const buildSteps = (): WorkoutStep[] => [
  { id: 'step-01', stepNumber: 1, title: 'STEP 01', description: 'Warm-up spin, easy cadence 90 rpm', targetZone: 'Zone 1', isCompleted: false },
  { id: 'step-02', stepNumber: 2, title: 'STEP 02', description: 'Tempo block 3 x 8 min', targetZone: 'Zone 3', isCompleted: false },
  { id: 'step-03', stepNumber: 3, title: 'STEP 03', description: 'Threshold intervals 4 x 5 min', targetZone: 'Zone 4', isCompleted: false },
  { id: 'step-04', stepNumber: 4, title: 'STEP 04', description: 'Cool-down and mobility', targetZone: 'Zone 1', isCompleted: false },
];

const buildPhases = (): PhaseProgress[] => [
  { id: 'phase-01', phaseName: 'Warm-up', completionPercentage: 40, status: 'IN_PROGRESS' },
  { id: 'phase-02', phaseName: 'Tempo', completionPercentage: 0, status: 'PENDING' },
  { id: 'phase-03', phaseName: 'Threshold', completionPercentage: 0, status: 'PENDING' },
  { id: 'phase-04', phaseName: 'Cool-down', completionPercentage: 0, status: 'PENDING' },
];

export function createMockAdapter(): ApiTransportAdapter {
  let ratios: TrainingRatio[] = clone(DEFAULT_RATIOS);
  const stepsByRoutine = new Map<string, WorkoutStep[]>();
  const phasesByRoutine = new Map<string, PhaseProgress[]>();

  const steps = (routineId: string): WorkoutStep[] => {
    if (!stepsByRoutine.has(routineId)) stepsByRoutine.set(routineId, buildSteps());
    return stepsByRoutine.get(routineId) as WorkoutStep[];
  };
  const phases = (routineId: string): PhaseProgress[] => {
    if (!phasesByRoutine.has(routineId)) phasesByRoutine.set(routineId, buildPhases());
    return phasesByRoutine.get(routineId) as PhaseProgress[];
  };

  let current: BiometricMetric = {
    id: 'metric-0',
    heartRate: 142,
    powerOutput: 230,
    cadence: 88,
    trainingLoad: 64,
    updatedAt: new Date().toISOString(),
  };
  let tick = 0;

  const nextMetric = (): BiometricMetric => {
    tick += 1;
    const spike = Math.random() < 0.12;
    const heartRate = spike
      ? HEART_RATE_LIMIT + 2 + Math.random() * 10
      : clamp(current.heartRate + (Math.random() - 0.5) * 8 - (current.heartRate > 165 ? 4 : 0), 110, 170);
    const powerOutput = spike
      ? POWER_LIMIT + 5 + Math.random() * 40
      : clamp(current.powerOutput + (Math.random() - 0.5) * 30 - (current.powerOutput > 300 ? 25 : 0), 150, 300);
    current = {
      id: `metric-${tick}`,
      heartRate: Math.round(heartRate),
      powerOutput: Math.round(powerOutput),
      cadence: Math.round(clamp(current.cadence + (Math.random() - 0.5) * 6, 70, 105)),
      trainingLoad: Math.round(clamp(current.trainingLoad + (Math.random() - 0.4) * 2, 40, 120)),
      updatedAt: new Date().toISOString(),
    };
    return clone(current);
  };

  const route = (method: HttpMethod, url: string): unknown => {
    const path = url.split('?')[0].replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '');
    const fail = (status: number): never => {
      throw new ApiError(`Mock: ${status} ${method} ${path}`, status, url);
    };

    if (method === 'GET' && path === '/athlete/profile') return clone(PROFILE);
    if (method === 'GET' && path === '/telemetry/snapshot') return clone(current);
    if (method === 'GET' && path === '/telemetry/ratios') return clone(ratios);
    if (method === 'POST' && path === '/telemetry/reset') {
      ratios = clone(DEFAULT_RATIOS);
      return clone(ratios);
    }

    const m = /^\/routines\/([^/]+)\/(steps|phases|advance-phase)$/.exec(path);
    if (m) {
      const [, routineId, kind] = m;
      if (method === 'GET' && kind === 'steps') return clone(steps(routineId));
      if (method === 'GET' && kind === 'phases') return clone(phases(routineId));
      if (method === 'POST' && kind === 'advance-phase') {
        const list = phases(routineId);
        const idx = list.findIndex((p) => p.status === 'IN_PROGRESS');
        if (idx >= 0) {
          list[idx] = { ...list[idx], completionPercentage: 100, status: 'COMPLETED' };
          if (idx + 1 < list.length) {
            list[idx + 1] = { ...list[idx + 1], completionPercentage: 10, status: 'IN_PROGRESS' };
          }
        }
        return clone(list);
      }
    }

    const c = /^\/routines\/([^/]+)\/steps\/([^/]+)\/complete$/.exec(path);
    if (c && method === 'POST') {
      const list = steps(c[1]);
      const idx = list.findIndex((s) => s.id === c[2]);
      if (idx < 0) return fail(404);
      list[idx] = { ...list[idx], isCompleted: true };
      return clone(list[idx]);
    }

    return fail(404);
  };

  return {
    request<T>(method: HttpMethod, url: string): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(route(method, url) as T);
          } catch (error: unknown) {
            reject(error);
          }
        }, 150);
      });
    },
    subscribe<T>(channel: string, handler: (message: T) => void): Unsubscribe {
      if (channel !== 'telemetry') return () => undefined;
      const timer = setInterval(() => handler(nextMetric() as unknown as T), STREAM_INTERVAL_MS);
      return () => clearInterval(timer);
    },
  };
}
