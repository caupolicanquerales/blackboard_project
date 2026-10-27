import { create } from 'zustand';
import type { PhaseProgress } from '../models/phase-progress';
import type { WorkoutStep } from '../models/workout-step';
import { workoutService } from '../services/workout.service';
import { useNotificationStore } from './notification.store';

export type WorkoutStatus = 'idle' | 'loading' | 'success' | 'error';

interface WorkoutState {
  steps: WorkoutStep[];
  phases: PhaseProgress[];
  status: WorkoutStatus;
  error?: string;
  routineId: string | null;
  load: (routineId: string) => Promise<void>;
  completeStep: (stepId: string) => Promise<void>;
  advancePhase: () => Promise<void>;
}

const errMsg = (e: unknown, fallback: string): string => (e instanceof Error ? e.message : fallback);

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  steps: [],
  phases: [],
  status: 'idle',
  error: undefined,
  routineId: null,
  load: async (routineId) => {
    set({ status: 'loading', error: undefined, routineId });
    try {
      const [steps, phases] = await Promise.all([
        workoutService.fetchSteps(routineId),
        workoutService.fetchPhases(routineId),
      ]);
      if (get().routineId !== routineId) return;
      set({ steps, phases, status: 'success' });
    } catch (e) {
      if (get().routineId !== routineId) return;
      set({ status: 'error', error: errMsg(e, 'Failed to load workout') });
    }
  },
  completeStep: async (stepId) => {
    const { routineId } = get();
    if (!routineId) return;
    try {
      const updated = await workoutService.completeStep(routineId, stepId);
      set((s) => ({ steps: s.steps.map((st) => (st.id === stepId ? updated : st)) }));
    } catch (e) {
      set({ error: errMsg(e, 'Failed to complete step') });
    }
  },
  advancePhase: async () => {
    const { routineId } = get();
    if (!routineId) return;
    try {
      const phases = await workoutService.advancePhase(routineId);
      set({ phases });
      const current = phases.find((p) => p.status === 'IN_PROGRESS');
      useNotificationStore
        .getState()
        .push(current ? `Phase transition: ${current.phaseName}` : 'Workout complete', 'info');
    } catch (e) {
      const message = errMsg(e, 'Failed to advance phase');
      set({ error: message });
      useNotificationStore.getState().push(message, 'warning');
    }
  },
}));
