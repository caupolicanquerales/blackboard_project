import { apiClient } from '../api/api-client';
import type { Unsubscribe } from '../api/api-client';
import { config } from '../config';
import type { BiometricMetric } from '../models/biometric-metric';
import type { TrainingRatio } from '../models/training-ratio';

export const telemetryService = {
  fetchSnapshot(): Promise<BiometricMetric> {
    return apiClient.request<BiometricMetric>('GET', '/telemetry/snapshot');
  },

  fetchRatios(): Promise<TrainingRatio[]> {
    return apiClient.request<TrainingRatio[]>('GET', '/telemetry/ratios');
  },

  resetRatios(): Promise<TrainingRatio[]> {
    return apiClient.request<TrainingRatio[]>('POST', '/telemetry/reset');
  },

  subscribe(onMetric: (metric: BiometricMetric) => void): Unsubscribe {
    return apiClient.subscribe<BiometricMetric>(config.TELEMETRY_STREAM_CHANNEL, onMetric);
  },
};
