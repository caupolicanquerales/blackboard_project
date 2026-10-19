import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface BiometricMetric {
  id: string;
  heartRate: number;
  respiratoryRate: number;
  trainingLoad: number;
  updatedAt: string;
}

interface TrainingRatio {
  id: string;
  primaryPercentage: number;
  secondaryPercentage: number;
  categoryLabel: string;
}

interface WorkoutStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface PhaseProgress {
  id: string;
  label: string;
  status: PhaseStatus;
  percentage: number;
}

const MOCK_DELAY_MS = 300;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const drift = (value: number, step: number, min: number, max: number): number =>
  clamp(Math.round(value + (Math.random() * 2 - 1) * step), min, max);

let currentMetric: BiometricMetric = {
  id: 'm1',
  heartRate: 148,
  respiratoryRate: 28,
  trainingLoad: 620,
  updatedAt: new Date().toISOString(),
};

const ratios: TrainingRatio[] = [
  { id: 'r1', primaryPercentage: 30, secondaryPercentage: 70, categoryLabel: 'Strength vs Cardio' },
  { id: 'r2', primaryPercentage: 50, secondaryPercentage: 50, categoryLabel: 'Push vs Pull' },
];

const stepsByRoutine = new Map<string, WorkoutStep[]>();
const phasesByRoutine = new Map<string, PhaseProgress[]>();

const buildSteps = (): WorkoutStep[] => [
  { id: 's1', stepNumber: 1, title: 'Warm-up', description: 'Dynamic mobility and light cardio for 10 minutes.', isCompleted: false },
  { id: 's2', stepNumber: 2, title: 'Strength block', description: 'Compound lifts: 4 sets of 6 reps at 80% 1RM.', isCompleted: false },
  { id: 's3', stepNumber: 3, title: 'Conditioning', description: 'High-intensity intervals: 8 rounds of 30s on, 30s off.', isCompleted: false },
  { id: 's4', stepNumber: 4, title: 'Cool-down', description: 'Stretching and breathing recovery for 10 minutes.', isCompleted: false },
];

const buildPhases = (): PhaseProgress[] =>
  [1, 2, 3, 4].map((n) => ({
    id: `p${n}`,
    label: `STEP 0${n}`,
    status: n === 1 ? 'IN_PROGRESS' : 'PENDING',
    percentage: n === 1 ? 80 : 0,
  }));

const getSteps = (routineId: string): WorkoutStep[] => {
  let steps = stepsByRoutine.get(routineId);
  if (!steps) {
    steps = buildSteps();
    stepsByRoutine.set(routineId, steps);
  }
  return steps;
};

const getPhases = (routineId: string): PhaseProgress[] => {
  let phases = phasesByRoutine.get(routineId);
  if (!phases) {
    phases = buildPhases();
    phasesByRoutine.set(routineId, phases);
  }
  return phases;
};

export const devApiInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  if (!path.startsWith('/api/')) {
    return next(req);
  }

  const respond = (body: unknown) =>
    of(new HttpResponse({ status: 200, body })).pipe(delay(MOCK_DELAY_MS));

  if (req.method === 'GET') {
    if (path === '/api/telemetry/snapshot') {
      return respond({ ...currentMetric, updatedAt: new Date().toISOString() });
    }
    if (path === '/api/telemetry/stream') {
      currentMetric = {
        ...currentMetric,
        heartRate: drift(currentMetric.heartRate, 8, 120, 190),
        respiratoryRate: drift(currentMetric.respiratoryRate, 3, 20, 45),
        trainingLoad: drift(currentMetric.trainingLoad, 25, 400, 950),
        updatedAt: new Date().toISOString(),
      };
      return respond(currentMetric);
    }
    if (path === '/api/dashboard/ratios') {
      return respond(ratios.map((r) => ({ ...r })));
    }
    const stepsMatch = path.match(/^\/api\/routines\/([^/]+)\/steps$/);
    if (stepsMatch) {
      return respond(getSteps(decodeURIComponent(stepsMatch[1])).map((s) => ({ ...s })));
    }
    const phasesMatch = path.match(/^\/api\/routines\/([^/]+)\/phases$/);
    if (phasesMatch) {
      return respond(getPhases(decodeURIComponent(phasesMatch[1])).map((p) => ({ ...p })));
    }
  }

  if (req.method === 'POST') {
    const completeMatch = path.match(/^\/api\/routines\/([^/]+)\/steps\/([^/]+)\/complete$/);
    if (completeMatch) {
      const steps = getSteps(decodeURIComponent(completeMatch[1]));
      const stepId = decodeURIComponent(completeMatch[2]);
      const step = steps.find((s) => s.id === stepId || String(s.stepNumber) === stepId);
      if (step) {
        step.isCompleted = true;
        return respond({ ...step });
      }
      return of(new HttpResponse({ status: 404, body: { message: 'Step not found' } })).pipe(
        delay(MOCK_DELAY_MS),
      );
    }
    const advanceMatch = path.match(/^\/api\/routines\/([^/]+)\/advance$/);
    if (advanceMatch) {
      const phases = getPhases(decodeURIComponent(advanceMatch[1]));
      const idx = phases.findIndex((p) => p.status === 'IN_PROGRESS');
      if (idx >= 0) {
        phases[idx] = { ...phases[idx], status: 'COMPLETED', percentage: 100 };
        if (idx + 1 < phases.length) {
          phases[idx + 1] = { ...phases[idx + 1], status: 'IN_PROGRESS', percentage: 0 };
        }
      }
      return respond(phases.map((p) => ({ ...p })));
    }
  }

  return next(req);
};
