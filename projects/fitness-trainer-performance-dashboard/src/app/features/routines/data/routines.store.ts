import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ToastStore } from '../../../core/notifications/toast.store';
import { PhaseProgress, ViewState, WorkoutStep } from '../../../shared/models/workout.model';
import { RoutinesApi } from './routines.api';

@Injectable()
export class RoutinesStore {
  private readonly api = inject(RoutinesApi);
  private readonly toast = inject(ToastStore);

  private routineId: string | null = null;

  private readonly _state = signal<ViewState>('loading');
  private readonly _steps = signal<WorkoutStep[]>([]);
  private readonly _phases = signal<PhaseProgress[]>([]);
  private readonly _selectedStepId = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly steps = this._steps.asReadonly();
  readonly phases = this._phases.asReadonly();
  readonly selectedStepId = this._selectedStepId.asReadonly();
  readonly selectedStep = computed<WorkoutStep | null>(() => {
    const id = this._selectedStepId();
    return this._steps().find((s) => s.id === id) ?? null;
  });

  load(routineId: string): void {
    this.routineId = routineId;
    this._state.set('loading');
    forkJoin({
      steps: this.api.getSteps(routineId),
      phases: this.api.getPhases(routineId),
    }).subscribe({
      next: ({ steps, phases }) => {
        const list = steps ?? [];
        this._steps.set(list);
        this._phases.set(phases ?? []);
        this._selectedStepId.set((list.find((s) => !s.isCompleted) ?? list[0])?.id ?? null);
        this._state.set(list.length || phases?.length ? 'success' : 'empty');
      },
      error: () => this._state.set('error'),
    });
  }

  selectStep(stepId: string): void {
    if (this._steps().some((s) => s.id === stepId)) {
      this._selectedStepId.set(stepId);
    }
  }

  completeSelected(): void {
    const routineId = this.routineId;
    const step = this.selectedStep();
    if (!routineId || !step || step.isCompleted) return;

    this.api.completeStep(routineId, step.id).subscribe({
      next: (updated) => {
        this._steps.update((list) => list.map((s) => (s.id === step.id ? { ...s, ...updated } : s)));
        const next = this._steps().find((s) => !s.isCompleted);
        if (next) this._selectedStepId.set(next.id);
        this.toast.show(`Step "${step.title}" completed`, 'success');
      },
      error: () => this.toast.show('Could not complete the step', 'error'),
    });
  }

  advance(): void {
    const routineId = this.routineId;
    if (!routineId) return;

    this.api.advancePhase(routineId).subscribe({
      next: (phases) => {
        this._phases.set(phases ?? []);
        const current = (phases ?? []).find((p) => p.status === 'IN_PROGRESS');
        this.toast.show(
          current ? `Advanced to phase "${current.phaseName}"` : 'All phases completed',
          'info',
        );
      },
      error: () => this.toast.show('Could not advance the phase', 'error'),
    });
  }
}
