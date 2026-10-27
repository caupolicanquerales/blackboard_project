import { apiClient } from '../api/api-client';
import type { PhaseProgress } from '../models/phase-progress';
import type { WorkoutStep } from '../models/workout-step';

const routinePath = (routineId: string): string => `/routines/${encodeURIComponent(routineId)}`;

export const workoutService = {
  fetchSteps(routineId: string): Promise<WorkoutStep[]> {
    return apiClient.request<WorkoutStep[]>('GET', `${routinePath(routineId)}/steps`);
  },

  fetchPhases(routineId: string): Promise<PhaseProgress[]> {
    return apiClient.request<PhaseProgress[]>('GET', `${routinePath(routineId)}/phases`);
  },

  completeStep(routineId: string, stepId: string): Promise<WorkoutStep> {
    return apiClient.request<WorkoutStep>(
      'POST',
      `${routinePath(routineId)}/steps/${encodeURIComponent(stepId)}/complete`,
    );
  },

  advancePhase(routineId: string): Promise<PhaseProgress[]> {
    return apiClient.request<PhaseProgress[]>('POST', `${routinePath(routineId)}/advance-phase`);
  },
};
