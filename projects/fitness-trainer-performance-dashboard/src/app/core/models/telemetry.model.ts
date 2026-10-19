export interface BiometricMetric {
  id: string;
  heartRate: number;
  respiratoryRate: number;
  trainingLoad: number;
  updatedAt: string;
}

export interface TelemetryThresholds {
  maxHeartRate: number;
  maxRespiratoryRate: number;
  maxTrainingLoad: number;
}

export const DEFAULT_TELEMETRY_THRESHOLDS: TelemetryThresholds = {
  maxHeartRate: 180,
  maxRespiratoryRate: 40,
  maxTrainingLoad: 900,
};
