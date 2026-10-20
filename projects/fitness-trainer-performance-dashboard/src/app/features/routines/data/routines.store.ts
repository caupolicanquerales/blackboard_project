import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ToastStore } from '../../../core/alerts/toast.store';
import { PhaseProgress } from '../../../shared/models/phase-progress.model';
import { WorkoutStep } from '../../../shared/models/workout-step.model';
import { RoutinesApi } from './routines.api';

@Injectable({ providedIn: 'root' })
export class RoutinesStore {
  private readonly api = inject(RoutinesApi);
  private readonly toast = inject(ToastStore);

  private readonly _steps = signal<readonly WorkoutStep[]>([]);
  private readonly _phases = signal<readonly PhaseProgress[]>([]);
  private readonly _selectedStepId = signal<string | null>(null);
  private readonly _phaseFeedback = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private routineId: string | null = null;

  readonly steps: Signal<readonly WorkoutStep[]> = this._steps.asReadonly();
  readonly phases: Signal<readonly PhaseProgress[]> = this._phases.asReadonly();
  readonly selectedStep: Signal<WorkoutStep | null> = computed(
    () => this._steps().find((s) => s.id === this._selectedStepId()) ?? null,
  );
  readonly phaseFeedback: Signal<string | null> = this._phaseFeedback.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  load(routineId: string): void {
    this.routineId = routineId;
    this._loading.set(true);
    this._error.set(null);
    forkJoin({ steps: this.api.getSteps(routineId), phases: this.api.getPhases() }).subscribe({
      next: ({ steps, phases }) => {
        this._steps.set(steps);
        this._phases.set(phases);
        this._selectedStepId.set(steps[0]?.id ?? null);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Failed to load routine');
        this._loading.set(false);
      },
    });
  }

  selectStep(stepId: string): void {
    this._selectedStepId.set(stepId);
  }

  completeStep(stepId: string): void {
    if (this.routineId === null) {
      return;
    }
    this._error.set(null);
    this.api.completeStep(this.routineId, stepId).subscribe({
      next: (updated) => {
        this._steps.update((steps) => steps.map((s) => (s.id === updated.id ? updated : s)));
        this.toast.show(`Step ${updated.stepNumber} completed`, 'success');
      },
      error: () => {
        this._error.set('Failed to complete step');
        this.toast.show('Failed to complete step', 'error');
      },
    });
  }

  advancePhase(): void {
    this._error.set(null);
    this.api.advancePhase().subscribe({
      next: (phases) => {
        this._phases.set(phases);
        const active = phases.findIndex((p) => p.status === 'IN_PROGRESS');
        const completed = phases.filter((p) => p.status === 'COMPLETED').length;
        const n = active >= 0 ? active + 1 : Math.min(completed + 1, phases.length);
        const message = `Advanced to STEP ${String(n).padStart(2, '0')}`;
        this._phaseFeedback.set(message);
        this.toast.show(message, 'success');
      },
      error: () => {
        this._error.set('Failed to advance phase');
        this.toast.show('Failed to advance phase', 'error');
      },
    });
  }
}
