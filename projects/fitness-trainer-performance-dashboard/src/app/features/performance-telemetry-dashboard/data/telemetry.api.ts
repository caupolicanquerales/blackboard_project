import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BiometricMetric } from './biometric-metric.model';
import { TrainingRatio } from './training-ratio.model';

@Injectable({ providedIn: 'root' })
export class TelemetryApi {
  private readonly http = inject(HttpClient);

  getSnapshot(): Observable<BiometricMetric> {
    return this.http.get<BiometricMetric>('/api/telemetry/snapshot');
  }

  getRatios(): Observable<TrainingRatio[]> {
    return this.http.get<TrainingRatio[]>('/api/telemetry/ratios');
  }

  resetRatios(): Observable<TrainingRatio[]> {
    return this.http.post<TrainingRatio[]>('/api/telemetry/ratios/reset', {});
  }
}
