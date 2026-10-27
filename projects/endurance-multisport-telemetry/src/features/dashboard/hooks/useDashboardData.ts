import { useCallback, useEffect, useMemo, useState } from 'react';
import { config } from '../../../core/config';
import type { BiometricMetric } from '../../../core/models/biometric-metric';
import type { TrainingRatio } from '../../../core/models/training-ratio';
import { useNotificationStore } from '../../../core/store/notification.store';
import { useTelemetryStore } from '../../../core/store/telemetry.store';
import { useWorkoutStore } from '../../../core/store/workout.store';
import type { IntervalCardItem } from '../../../shared/models/interval-card-item';
import type { LoadStatus } from '../../../shared/models/load-status';
import type { StepState } from '../../../shared/models/step-state';
import type { TimelineStep } from '../../../shared/models/timeline-step';

export interface DashboardGauges {
  targetLoadPct: number;
  intervalPct: number;
}

export interface DashboardData {
  metric: BiometricMetric | null;
  ratios: TrainingRatio[];
  steps: IntervalCardItem[];
  phases: TimelineStep[];
  gauges: DashboardGauges;
  status: LoadStatus;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onReset: () => Promise<void>;
}

const clampPct = (n: number): number => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);

const PHASE_STATE: Record<string, StepState> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'done',
};

export function useDashboardData(): DashboardData {
  const metric = useTelemetryStore((s) => s.metric);
  const ratios = useTelemetryStore((s) => s.ratios);
  const telemetryStatus = useTelemetryStore((s) => s.status);
  const refresh = useTelemetryStore((s) => s.refresh);
  const startStream = useTelemetryStore((s) => s.startStream);
  const stopStream = useTelemetryStore((s) => s.stopStream);
  const resetRatios = useTelemetryStore((s) => s.resetRatios);

  const workoutSteps = useWorkoutStore((s) => s.steps);
  const workoutPhases = useWorkoutStore((s) => s.phases);
  const workoutStatus = useWorkoutStore((s) => s.status);
  const loadWorkout = useWorkoutStore((s) => s.load);

  const pushToast = useNotificationStore((s) => s.push);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refresh();
    void loadWorkout(config.DEFAULT_ROUTINE_ID);
    startStream();
    return () => {
      stopStream();
    };
  }, [refresh, loadWorkout, startStream, stopStream]);

  const steps = useMemo<IntervalCardItem[]>(
    () =>
      workoutSteps.map((s) => ({
        id: s.id,
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        targetZone: s.targetZone,
        isDone: s.isCompleted,
      })),
    [workoutSteps],
  );

  const phases = useMemo<TimelineStep[]>(
    () =>
      workoutPhases.map((p) => ({
        id: p.id,
        label: p.phaseName,
        state: PHASE_STATE[p.status] ?? 'pending',
      })),
    [workoutPhases],
  );

  const gauges = useMemo<DashboardGauges>(() => {
    const current = workoutPhases.find((p) => p.status === 'IN_PROGRESS');
    return {
      targetLoadPct: clampPct(metric?.trainingLoad ?? 0),
      intervalPct: clampPct(current?.completionPercentage ?? 0),
    };
  }, [metric, workoutPhases]);

  const noTelemetry = !metric && ratios.length === 0;
  let status: LoadStatus;
  if (telemetryStatus === 'error' && noTelemetry) status = 'error';
  else if (telemetryStatus === 'loading' && noTelemetry) status = 'loading';
  else if (noTelemetry && workoutSteps.length === 0 && workoutStatus !== 'loading') status = 'empty';
  else status = 'success';

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), loadWorkout(config.DEFAULT_ROUTINE_ID)]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, loadWorkout]);

  const onReset = useCallback(async (): Promise<void> => {
    await resetRatios();
    pushToast('Ratios reset', 'info');
  }, [resetRatios, pushToast]);

  return { metric, ratios, steps, phases, gauges, status, refreshing, onRefresh, onReset };
}
