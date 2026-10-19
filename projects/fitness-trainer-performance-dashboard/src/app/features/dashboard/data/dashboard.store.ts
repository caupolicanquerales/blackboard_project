import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';

import { BiometricMetric } from '../../../core/models/telemetry.model';
import { TelemetryService } from '../../../core/telemetry/telemetry.service';
import { PhaseProgress, ViewState, WorkoutStep } from '../../../shared/models/workout.model';
import { DashboardApi } from './dashboard.api';
import { GaugeValue, TrainingRatio } from './dashboard.model';

const LIVE_INTERVAL_MS = 3000;

@Injectable()
export class DashboardStore {
  private readonly api = inject(DashboardApi);
  private readonly telemetry = inject(TelemetryService);

  private liveSub: Subscription | null = null;

  private readonly _state = signal<ViewState>('loading');
  private readonly _metric = signal<BiometricMetric | null>(null);
  private readonly _ratios = signal<TrainingRatio[]>([]);
  private readonly _steps = signal<WorkoutStep[]>([]);
  private readonly _phases = signal<PhaseProgress[]>([]);

  readonly state = this._state.asReadonly();
  readonly metric = this._metric.asReadonly();
  readonly ratios = this._ratios.asReadonly();
  readonly steps = this._steps.asReadonly();
  readonly phases = this._phases.asReadonly();

  readonly intensity = computed(() => {
    const load = this._metric()?.trainingLoad ?? 0;
    return Math.min(100, Math.max(0, load / 10));
  });

  readonly gauges = computed<GaugeValue[]>(() => {
    const steps = this._steps();
    const done = steps.length
      ? Math.round((steps.filter((s) => s.isCompleted).length / steps.length) * 100)
      : 0;
    return [
      { id: 'completed', label: 'Completed', percentage: done },
      { id: 'remaining', label: 'Remaining', percentage: 100 - done },
    ];
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopLive());
  }

  load(): void {
    this._state.set('loading');
    forkJoin({
      metric: this.telemetry.getSnapshot(),
      ratios: this.api.getRatios(),
      steps: this.api.getSteps(),
      phases: this.api.getPhases(),
    }).subscribe({
      next: ({ metric, ratios, steps, phases }) => {
        this._metric.set(metric ?? null);
        this._ratios.set(ratios ?? []);
        this._steps.set(steps ?? []);
        this._phases.set(phases ?? []);
        const empty = !metric && !ratios?.length && !steps?.length && !phases?.length;
        this._state.set(empty ? 'empty' : 'success');
      },
      error: () => this._state.set('error'),
    });
  }

  startLive(): void {
    if (this.liveSub) return;
    this.liveSub = this.telemetry.streamLive(LIVE_INTERVAL_MS).subscribe({
      next: (metric) => this._metric.set(metric),
    });
  }

  stopLive(): void {
    this.liveSub?.unsubscribe();
    this.liveSub = null;
  }

  resetRatios(): void {
    this.api.getRatios().subscribe({
      next: (ratios) => this._ratios.set(ratios ?? []),
    });
  }
}
