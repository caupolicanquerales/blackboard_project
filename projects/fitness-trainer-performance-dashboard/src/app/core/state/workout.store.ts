import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { WorkoutApi } from '../api/workout.api';
import { PhaseProgress } from '../models/phase-progress.model';
import { WorkoutStep } from '../models/workout-step.model';
import { ToastStore } from './toast.store';

export type WorkoutStatus = 'loading' | 'empty' | 'error' | 'success';

@Injectable({ providedIn: 'root' })
export class WorkoutStore {
  private readonly api = inject(WorkoutApi);
  private readonly toast = inject(ToastStore);

  private readonly _steps = signal<WorkoutStep[]>([]);
  private readonly _phases = signal<PhaseProgress[]>([]);
  private readonly _selectedStepId = signal<string | null>(null);
  private readonly _status = signal<WorkoutStatus>('loading');

  readonly steps = this._steps.asReadonly();
  readonly phases = this._phases.asReadonly();
  readonly selectedStepId = this._selectedStepId.asReadonly();
  readonly status = this._status.asReadonly();

  readonly completedCount = computed(() => this._steps().filter((s) => s.isCompleted).length);

  readonly activeStep = computed<WorkoutStep | null>(() => {
    const steps = this._steps();
    const id = this._selectedStepId();
    return (id ? steps.find((s) => s.id === id) : undefined) ?? steps.find((s) => !s.isCompleted) ?? null;
  });

  // Same phase state the timeline renders: completed phases count 100%, in-progress their own percent.
  readonly completedPercentage = computed(() => {
    const phases = this._phases();
    if (phases.length > 0) {
      const sum = phases.reduce((acc, p) => {
        const pct = p.status === 'COMPLETED' ? 100 : p.status === 'IN_PROGRESS' ? p.completionPercentage : 0;
        return acc + Math.min(100, Math.max(0, Number(pct) || 0));
      }, 0);
      return Math.round(sum / phases.length);
    }
    const total = this._steps().length;
    return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
  });

  readonly remainingPercentage = computed(() =>
    this._phases().length === 0 && this._steps().length === 0 ? 0 : 100 - this.completedPercentage(),
  );

  loadRoutine(routineId: string): void {
    this._status.set('loading');
    forkJoin({ steps: this.api.getSteps(routineId), phases: this.api.getPhases() }).subscribe({
      next: ({ steps, phases }) => {
        this._steps.set(steps.map((s, i) => ({ ...s, isCompleted: s.isCompleted || phases[i]?.status === 'COMPLETED' })));
        this._phases.set(phases);
        this._selectedStepId.set(null);
        this._status.set(steps.length === 0 ? 'empty' : 'success');
      },
      error: () => this._status.set('error'),
    });
  }

  selectStep(id: string): void {
    this._selectedStepId.set(id);
  }

  completeStep(id: string): void {
    this.api.completeStep(id).subscribe({
      next: (updated) => {
        this._steps.update((list) =>
          list.map((s) => (s.id === id ? { ...s, ...updated, isCompleted: true } : s)),
        );
        const index = this._steps().findIndex((s) => s.id === id);
        this._phases.update((list) =>
          list.map((p, i) =>
            i === index ? { ...p, completionPercentage: 100, status: 'COMPLETED' as const } : p,
          ),
        );
        this.toast.show('Step completed', 'success');
      },
      error: () => this.toast.show('Could not complete step', 'error'),
    });
  }

  advancePhase(): void {
    this.api.advancePhase().subscribe({
      next: (phases) => {
        this._phases.set(phases);
        this.toast.show('Phase advanced', 'info');
      },
      error: () => this.toast.show('Could not advance phase', 'error'),
    });
  }
}
