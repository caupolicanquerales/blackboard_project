import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap, timer } from 'rxjs';

import {
  BiometricMetric,
  DEFAULT_TELEMETRY_THRESHOLDS,
} from '../models/telemetry.model';
import { ToastStore } from '../notifications/toast.store';

type MetricKind = 'heartRate' | 'respiratoryRate' | 'trainingLoad';

const ALERT_THROTTLE_MS = 15000;

@Service()
export class TelemetryService {
  private readonly http = inject(HttpClient);
  private readonly toastStore = inject(ToastStore);
  private readonly lastAlertAt = new Map<MetricKind, number>();

  getSnapshot(): Observable<BiometricMetric> {
    return this.http.get<BiometricMetric>('/api/telemetry/snapshot');
  }

  streamLive(intervalMs: number): Observable<BiometricMetric> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.http.get<BiometricMetric>('/api/telemetry/stream')),
      tap((metric) => this.checkThresholds(metric)),
    );
  }

  private checkThresholds(metric: BiometricMetric): void {
    const t = DEFAULT_TELEMETRY_THRESHOLDS;
    if (metric.heartRate > t.maxHeartRate) {
      this.alert('heartRate', `Heart rate high: ${metric.heartRate} bpm`);
    }
    if (metric.respiratoryRate > t.maxRespiratoryRate) {
      this.alert('respiratoryRate', `Respiratory rate high: ${metric.respiratoryRate} rpm`);
    }
    if (metric.trainingLoad > t.maxTrainingLoad) {
      this.alert('trainingLoad', `Training load high: ${metric.trainingLoad}`);
    }
  }

  private alert(kind: MetricKind, message: string): void {
    const now = Date.now();
    const last = this.lastAlertAt.get(kind);
    if (last !== undefined && now - last < ALERT_THROTTLE_MS) {
      return;
    }
    this.lastAlertAt.set(kind, now);
    this.toastStore.show(message, 'warning');
  }
}
