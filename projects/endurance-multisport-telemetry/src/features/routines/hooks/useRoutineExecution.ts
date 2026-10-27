import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo } from 'react';
import { config } from '../../../core/config';
import { useWorkoutStore } from '../../../core/store/workout.store';
import type { IntervalCardItem } from '../../../shared/models/interval-card-item';
import type { LoadStatus } from '../../../shared/models/load-status';
import type { StepState } from '../../../shared/models/step-state';
import type { TimelineStep } from '../../../shared/models/timeline-step';

export interface RoutineExecution {
  timelineSteps: TimelineStep[];
  cardItems: IntervalCardItem[];
  status: LoadStatus;
  activeStep: IntervalCardItem | null;
  onCompleteStep: (stepId: string) => Promise<void>;
  onAdvancePhase: () => Promise<void>;
  canAdvance: boolean;
}

const PHASE_STATE: Record<string, StepState> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'done',
};

export function useRoutineExecution(routineId: string = config.DEFAULT_ROUTINE_ID): RoutineExecution {
  const steps = useWorkoutStore((s) => s.steps);
  const phases = useWorkoutStore((s) => s.phases);
  const storeStatus = useWorkoutStore((s) => s.status);
  const load = useWorkoutStore((s) => s.load);
  const completeStep = useWorkoutStore((s) => s.completeStep);
  const advancePhase = useWorkoutStore((s) => s.advancePhase);

  useEffect(() => {
    void load(routineId);
  }, [load, routineId]);

  const timelineSteps = useMemo<TimelineStep[]>(
    () =>
      phases.map((p) => ({
        id: p.id,
        label: p.phaseName,
        state: PHASE_STATE[p.status] ?? 'pending',
      })),
    [phases],
  );

  const cardItems = useMemo<IntervalCardItem[]>(
    () =>
      steps.map((s) => ({
        id: s.id,
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        targetZone: s.targetZone,
        isDone: s.isCompleted,
      })),
    [steps],
  );

  const activeStep = useMemo<IntervalCardItem | null>(
    () => cardItems.find((c) => !c.isDone) ?? null,
    [cardItems],
  );

  let status: LoadStatus;
  if (storeStatus === 'error') status = 'error';
  else if (storeStatus === 'idle' || storeStatus === 'loading') status = 'loading';
  else if (steps.length === 0 && phases.length === 0) status = 'empty';
  else status = 'success';

  const canAdvance = phases.some((p) => p.status === 'IN_PROGRESS') && storeStatus === 'success';

  const onCompleteStep = useCallback(
    async (stepId: string): Promise<void> => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // haptics unavailable on this device
      }
      await completeStep(stepId);
    },
    [completeStep],
  );

  const onAdvancePhase = useCallback(async (): Promise<void> => {
    if (!canAdvance) return;
    await advancePhase();
  }, [advancePhase, canAdvance]);

  return { timelineSteps, cardItems, status, activeStep, onCompleteStep, onAdvancePhase, canAdvance };
}
