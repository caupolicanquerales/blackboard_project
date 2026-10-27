export interface AppConfig {
  readonly API_BASE_URL: string;
  readonly DEFAULT_ROUTINE_ID: string;
  readonly TELEMETRY_STREAM_CHANNEL: string;
  readonly MAX_HEART_RATE_BPM: number;
  readonly MAX_POWER_WATTS: number;
  readonly TOAST_DEFAULT_TIMEOUT_MS: number;
  readonly SENSOR_STALE_MS: number;
}

export const config: AppConfig = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
  DEFAULT_ROUTINE_ID: 'routine-default',
  TELEMETRY_STREAM_CHANNEL: 'telemetry',
  MAX_HEART_RATE_BPM: 190,
  MAX_POWER_WATTS: 400,
  TOAST_DEFAULT_TIMEOUT_MS: 3000,
  SENSOR_STALE_MS: 5000,
};
