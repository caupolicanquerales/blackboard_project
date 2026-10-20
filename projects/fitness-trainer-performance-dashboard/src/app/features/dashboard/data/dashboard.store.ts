import { Injectable, Signal, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DashboardApi } from './dashboard.api';
import { TrainingRatio } from './training-ratio.model';
import { PhaseProgress } from '../../../shared/models/phase-progress.model';
import { WorkoutStep } from '../../../shared/models/workout-step.model';
import { ToastStore } from '../../../core/alerts/toast.store';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly api = inject(DashboardApi);
  private readonly toast = inject(ToastStore);

  private readonly ratiosState = signal<readonly TrainingRatio[]>([]);
  private readonly phasesState = signal<readonly PhaseProgress[]>([]);
  private readonly stepsState = signal<readonly WorkoutStep[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly ratios: Signal<readonly TrainingRatio[]> = this.ratiosState.asReadonly();
  readonly phases: Signal<readonly PhaseProgress[]> = this.phasesState.asReadonly();
  readonly steps: Signal<readonly WorkoutStep[]> = this.stepsState.asReadonly();
  readonly loading: Signal<boolean> = this.loadingState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    forkJoin({
      ratios: this.api.getTrainingRatios(),
      phases: this.api.getPhases(),
      steps: this.api.getSteps('default'),
    }).subscribe({
      next: ({ ratios, phases, steps }) => {
        this.ratiosState.set(ratios);
        this.phasesState.set(phases);
        this.stepsState.set(steps);
        this.loadingState.set(false);
      },
      error: () => {
        this.errorState.set('Failed to load dashboard data');
        this.loadingState.set(false);
      },
    });
  }

  resetRatios(): void {
    this.api.resetTrainingRatios().subscribe({
      next: (ratios) => {
        this.ratiosState.set(ratios);
        this.toast.show('Comparative metrics reset', 'info');
      },
      error: () => this.errorState.set('Failed to reset comparative metrics'),
    });
  }
}
