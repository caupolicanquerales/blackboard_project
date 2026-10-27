import type { BiometricMetric } from '../../../../core/models/biometric-metric';
import type { LoadStatus } from '../../../../shared/models/load-status';

export type BiometricMetricKind = 'heart' | 'power' | 'cadence';

export type BiometricTelemetryCardsProps = {
  metric: BiometricMetric | null;
  status: LoadStatus;
  onPressMetric: (kind: BiometricMetricKind) => void;
};
