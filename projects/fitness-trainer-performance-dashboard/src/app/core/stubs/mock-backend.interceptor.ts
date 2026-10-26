import { HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { PhaseProgress } from '../models/phase-progress.model';
import { WorkoutStep } from '../models/workout-step.model';

interface MockBiometricMetric {
  id: string;
  heartRate: number;
  respiratoryRate: number;
  trainingLoad: number;
  updatedAt: string;
}

interface MockTrainingRatio {
  id: string;
  primaryPercentage: number;
  secondaryPercentage: number;
  categoryLabel: string;
}

const LATENCY_MS = 150;

const initialRatios = (): MockTrainingRatio[] => [
  { id: 'ratio-1', primaryPercentage: 30, secondaryPercentage: 70, categoryLabel: 'Strength / Cardio' },
  { id: 'ratio-2', primaryPercentage: 50, secondaryPercentage: 50, categoryLabel: 'Endurance / Recovery' },
];

const initialSteps = (): WorkoutStep[] =>
  [
    ['Warm-up', 'Dynamic mobility and light cardio.'],
    ['Strength Block', 'Compound lifts at working intensity.'],
    ['Conditioning', 'Interval work at high heart rate.'],
    ['Cool-down', 'Stretching and breathing recovery.'],
  ].map(([title, description], i) => ({
    id: `step-${i + 1}`,
    stepNumber: i + 1,
    title,
    description,
    isCompleted: false,
  }));

const initialPhases = (): PhaseProgress[] => [
  { id: 'phase-1', phaseName: 'Warm-up', completionPercentage: 100, status: 'COMPLETED' },
  { id: 'phase-2', phaseName: 'Strength Block', completionPercentage: 45, status: 'IN_PROGRESS' },
  { id: 'phase-3', phaseName: 'Conditioning', completionPercentage: 0, status: 'PENDING' },
  { id: 'phase-4', phaseName: 'Cool-down', completionPercentage: 0, status: 'PENDING' },
];

let ratios = initialRatios();
const steps = initialSteps();
const phases = initialPhases();

const randomBetween = (min: number, max: number): number =>
  Math.round(min + Math.random() * (max - min));

const snapshot = (): MockBiometricMetric => ({
  id: 'snapshot',
  heartRate: randomBetween(120, 185),
  respiratoryRate: randomBetween(18, 40),
  trainingLoad: randomBetween(0, 100),
  updatedAt: new Date().toISOString(),
});

const advance = (): PhaseProgress[] => {
  const current = phases.findIndex((p) => p.status === 'IN_PROGRESS');
  if (current >= 0) {
    phases[current] = { ...phases[current], completionPercentage: 100, status: 'COMPLETED' };
    const next = current + 1;
    if (next < phases.length) {
      phases[next] = { ...phases[next], completionPercentage: 10, status: 'IN_PROGRESS' };
    }
  }
  return phases.map((p) => ({ ...p }));
};

const respond = <T>(req: HttpRequest<unknown>, body: T): Observable<HttpEvent<unknown>> =>
  of(new HttpResponse<T>({ status: 200, body, url: req.url })).pipe(delay(LATENCY_MS));

const notFound = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> =>
  throwError(() => new Error(`Mock backend: no handler for ${req.method} ${req.url}`));

export const mockBackendInterceptor: HttpInterceptorFn = (req) => {
  const path = req.url.split('?')[0];
  const method = req.method;

  if (method === 'GET' && path === '/api/telemetry/snapshot') return respond(req, snapshot());
  if (method === 'GET' && path === '/api/telemetry/ratios') return respond(req, ratios.map((r) => ({ ...r })));
  if (method === 'POST' && path === '/api/telemetry/ratios/reset') {
    ratios = initialRatios();
    return respond(req, ratios.map((r) => ({ ...r })));
  }
  if (method === 'GET' && path === '/api/phases') return respond(req, phases.map((p) => ({ ...p })));
  if (method === 'POST' && path === '/api/phases/advance') return respond(req, advance());

  const stepsMatch = path.match(/^\/api\/routines\/([^/]+)\/steps$/);
  if (method === 'GET' && stepsMatch) return respond(req, steps.map((s) => ({ ...s })));

  const completeMatch = path.match(/^\/api\/steps\/([^/]+)\/complete$/);
  if (method === 'POST' && completeMatch) {
    const idx = steps.findIndex((s) => s.id === completeMatch[1]);
    if (idx < 0) return notFound(req);
    steps[idx] = { ...steps[idx], isCompleted: true };
    return respond(req, { ...steps[idx] });
  }

  return notFound(req);
};
