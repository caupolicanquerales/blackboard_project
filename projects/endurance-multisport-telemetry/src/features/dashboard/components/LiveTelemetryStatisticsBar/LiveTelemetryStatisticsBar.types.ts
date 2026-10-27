import type { BiometricMetric } from '../../../../core/models/biometric-metric';
import type { LoadStatus } from '../../../../shared/models/load-status';

export type LiveTelemetryStatisticsBarProps = {
  metric: BiometricMetric | null;
  status: LoadStatus;
  maxHeartRate: number;
  maxPower: number;
};
