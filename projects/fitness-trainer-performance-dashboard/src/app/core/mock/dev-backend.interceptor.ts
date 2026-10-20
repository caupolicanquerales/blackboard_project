import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';

const LATENCY_MS = 150;

const initialRatios = () => [
  { id: 'r1', primaryPercentage: 30, secondaryPercentage: 70, categoryLabel: 'Strength vs Cardio' },
  { id: 'r2', primaryPercentage: 50, secondaryPercentage: 50, categoryLabel: 'Push vs Pull' },
];

const initialPhases = () => [
  { id: 'p1', phaseName: 'STEP 01', completionPercentage: 80, status: 'IN_PROGRESS' },
  { id: 'p2', phaseName: 'STEP 02', completionPercentage: 20, status: 'PENDING' },
  { id: 'p3', phaseName: 'STEP 03', completionPercentage: 0, status: 'PENDING' },
  { id: 'p4', phaseName: 'STEP 04', completionPercentage: 0, status: 'PENDING' },
];

const initialSteps = () => [
  {
    id: 's1',
    stepNumber: 1,
    title: 'Warm-up Sprint',
    description: 'Jog in place for two minutes then accelerate to a controlled sprint.',
    isCompleted: false,
  },
  {
    id: 's2',
    stepNumber: 2,
    title: 'Dumbbell Press',
    description: 'Press the dumbbells overhead for 3 sets of 10 reps with controlled tempo.',
    isCompleted: false,
  },
];

let ratios = initialRatios();
let phases = initialPhases();
const stepsByRoutine = new Map<string, ReturnType<typeof initialSteps>>();

let heartRate = 128;
let respiratoryRate = 24;
let trainingLoad = 72;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const snapshot = () => ({
  id: 'm1',
  heartRate: Math.round(heartRate),
  respiratoryRate: Math.round(respiratoryRate),
  trainingLoad: Math.round(trainingLoad),
  updatedAt: new Date().toISOString(),
});

const walkTelemetry = () => {
  heartRate = clamp(heartRate + (Math.random() - 0.5) * 8, 90, 175);
  respiratoryRate = clamp(respiratoryRate + (Math.random() - 0.5) * 2, 14, 40);
  trainingLoad = clamp(trainingLoad + (Math.random() - 0.5) * 4, 40, 100);
  if (Math.random() < 0.1) {
    heartRate = 181 + Math.random() * 9;
  }
};

const routineSteps = (routineId: string) => {
  let steps = stepsByRoutine.get(routineId);
  if (!steps) {
    steps = initialSteps();
    stepsByRoutine.set(routineId, steps);
  }
  return steps;
};

const advancePhases = () => {
  const index = phases.findIndex((p) => p.status === 'IN_PROGRESS');
  if (index >= 0) {
    phases[index] = { ...phases[index], status: 'COMPLETED', completionPercentage: 100 };
    if (index + 1 < phases.length) {
      phases[index + 1] = { ...phases[index + 1], status: 'IN_PROGRESS' };
    }
  }
  return phases;
};

export const devBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  const respond = (body: unknown) =>
    of(new HttpResponse({ status: 200, body })).pipe(delay(LATENCY_MS));

  if (req.method === 'GET') {
    switch (path) {
      case '/api/trainer/profile':
        return respond({
          id: 't1',
          displayName: 'Alex Carter',
          avatar: null,
          websiteUrl: 'https://www.example-trainer.com',
        });
      case '/api/telemetry/snapshot':
        return respond(snapshot());
      case '/api/telemetry/live':
        walkTelemetry();
        return respond(snapshot());
      case '/api/training-ratios':
        return respond(ratios);
      case '/api/phases':
        return respond(phases);
    }
    const stepsMatch = path.match(/^\/api\/routines\/([^/]+)\/steps$/);
    if (stepsMatch) {
      return respond(routineSteps(stepsMatch[1]));
    }
  }

  if (req.method === 'POST') {
    if (path === '/api/training-ratios/reset') {
      ratios = initialRatios();
      return respond(ratios);
    }
    if (path === '/api/phases/advance') {
      return respond(advancePhases());
    }
    const completeMatch = path.match(/^\/api\/routines\/([^/]+)\/steps\/([^/]+)\/complete$/);
    if (completeMatch) {
      const steps = routineSteps(completeMatch[1]);
      const index = steps.findIndex((s) => s.id === completeMatch[2]);
      if (index >= 0) {
        steps[index] = { ...steps[index], isCompleted: true };
        return respond(steps[index]);
      }
    }
  }

  return next(req);
};
