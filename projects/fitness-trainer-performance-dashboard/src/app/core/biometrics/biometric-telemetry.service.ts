import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Subscription, catchError, finalize, tap, timer, switchMap } from 'rxjs';
import { ToastStore } from '../alerts/toast.store';
import { BiometricMetric } from '../models/biometric-metric.model';

const SNAPSHOT_URL = '/api/telemetry/snapshot';
const LIVE_URL = '/api/telemetry/live';
const POLL_MS = 2000;
const HEART_RATE_LIMIT = 180;
const RESPIRATORY_RATE_LIMIT = 40;

@Service()
export class BiometricTelemetryService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastStore);

  private readonly metricState = signal<BiometricMetric | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private streamSub: Subscription | null = null;
  private heartRateExceeded = false;
  private respiratoryRateExceeded = false;

  readonly metric = this.metricState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadSnapshot(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.http
      .get<BiometricMetric>(SNAPSHOT_URL)
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (metric) => this.apply(metric),
        error: () => this.errorState.set('Unable to load biometric snapshot.'),
      });
  }

  startStream(): void {
    if (this.streamSub && !this.streamSub.closed) {
      return;
    }
    this.streamSub = timer(0, POLL_MS)
      .pipe(
        switchMap(() =>
          this.http.get<BiometricMetric>(LIVE_URL).pipe(
            catchError(() => {
              this.errorState.set('Live telemetry unavailable.');
              return EMPTY;
            }),
          ),
        ),
        tap((metric) => {
          this.errorState.set(null);
          this.apply(metric);
        }),
      )
      .subscribe();
  }

  stopStream(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
  }

  private apply(metric: BiometricMetric): void {
    this.metricState.set(metric);

    const hrOver = metric.heartRate > HEART_RATE_LIMIT;
    if (hrOver && !this.heartRateExceeded) {
      this.toast.show(`High heart rate: ${metric.heartRate} bpm`, 'warning');
    }
    this.heartRateExceeded = hrOver;

    const rrOver = metric.respiratoryRate > RESPIRATORY_RATE_LIMIT;
    if (rrOver && !this.respiratoryRateExceeded) {
      this.toast.show(`High respiratory rate: ${metric.respiratoryRate} rpm`, 'warning');
    }
    this.respiratoryRateExceeded = rrOver;
  }
}
