import { create } from 'zustand';
import type { Unsubscribe } from '../api/api-client';
import { config } from '../config';
import type { BiometricMetric } from '../models/biometric-metric';
import type { TrainingRatio } from '../models/training-ratio';
import { telemetryService } from '../services/telemetry.service';
import { useNotificationStore } from './notification.store';

export type TelemetryStatus = 'loading' | 'empty' | 'error' | 'success';

interface TelemetryState {
  metric: BiometricMetric | null;
  ratios: TrainingRatio[];
  status: TelemetryStatus;
  connected: boolean;
  refresh: () => Promise<void>;
  startStream: () => void;
  stopStream: () => void;
  resetRatios: () => Promise<void>;
}

let unsubscribe: Unsubscribe | null = null;
let staleTimer: ReturnType<typeof setTimeout> | null = null;

function clearStaleTimer(): void {
  if (staleTimer !== null) {
    clearTimeout(staleTimer);
    staleTimer = null;
  }
}

export const useTelemetryStore = create<TelemetryState>()((set, get) => {
  const armStaleTimer = (): void => {
    clearStaleTimer();
    staleTimer = setTimeout(() => {
      staleTimer = null;
      if (get().connected) {
        set({ connected: false });
        useNotificationStore.getState().push('Sensor disconnected', 'alert');
      }
    }, config.SENSOR_STALE_MS);
  };

  const handleMetric = (metric: BiometricMetric): void => {
    const notify = useNotificationStore.getState().push;
    if (!get().connected) set({ connected: true });
    set({ metric, status: 'success' });
    armStaleTimer();

    if (metric.heartRate > config.MAX_HEART_RATE_BPM) {
      notify(`Heart rate above limit: ${Math.round(metric.heartRate)} bpm`, 'alert');
    }
    if (metric.powerOutput > config.MAX_POWER_WATTS) {
      notify(`Power output above limit: ${Math.round(metric.powerOutput)} W`, 'warning');
    }
  };

  return {
    metric: null,
    ratios: [],
    status: 'loading',
    connected: false,
    refresh: async () => {
      set({ status: 'loading' });
      try {
        const [metric, ratios] = await Promise.all([
          telemetryService.fetchSnapshot(),
          telemetryService.fetchRatios(),
        ]);
        set({
          metric,
          ratios,
          status: metric || ratios.length > 0 ? 'success' : 'empty',
        });
      } catch {
        set({ status: 'error' });
      }
    },
    startStream: () => {
      if (unsubscribe) return;
      unsubscribe = telemetryService.subscribe(handleMetric);
      armStaleTimer();
    },
    stopStream: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      clearStaleTimer();
      set({ connected: false });
    },
    resetRatios: async () => {
      try {
        const ratios = await telemetryService.resetRatios();
        set({ ratios });
      } catch {
        useNotificationStore.getState().push('Failed to reset ratios', 'warning');
      }
    },
  };
});
