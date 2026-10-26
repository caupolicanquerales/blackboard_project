import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ToastStore } from '../../../core/state/toast.store';
import { BiometricMetric } from './biometric-metric.model';
import { TelemetryApi } from './telemetry.api';
import { TrainingRatio } from './training-ratio.model';

export type TelemetryStatus = 'loading' | 'empty' | 'error' | 'success';

const STREAM_INTERVAL_MS = 2000;
const HEART_RATE_THRESHOLD_BPM = 170;

@Injectable({ providedIn: 'root' })
export class TelemetryStore {
  private readonly api = inject(TelemetryApi);
  private readonly toast = inject(ToastStore);

  private readonly _metric = signal<BiometricMetric | null>(null);
  private readonly _ratios = signal<TrainingRatio[]>([]);
  private readonly _status = signal<TelemetryStatus>('loading');

  readonly metric = this._metric.asReadonly();
  readonly ratios = this._ratios.asReadonly();
  readonly status = this._status.asReadonly();
  readonly intensity = computed(() => this._metric()?.trainingLoad ?? 0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private warningActive = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopStream());
  }

  load(): void {
    this._status.set('loading');
    forkJoin({ metric: this.api.getSnapshot(), ratios: this.api.getRatios() }).subscribe({
      next: ({ metric, ratios }) => {
        this._metric.set(metric);
        this._ratios.set(ratios);
        this.checkHeartRate(metric);
        this._status.set(metric || ratios.length ? 'success' : 'empty');
      },
      error: () => this._status.set('error'),
    });
  }

  startStream(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      this.api.getSnapshot().subscribe({
        next: (metric) => {
          this._metric.set(metric);
          this.checkHeartRate(metric);
          if (this._status() !== 'success') this._status.set('success');
        },
        error: () => {
          if (!this._metric()) this._status.set('error');
        },
      });
    }, STREAM_INTERVAL_MS);
  }

  stopStream(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resetRatios(): void {
    this.api.resetRatios().subscribe({
      next: (ratios) => this._ratios.set(ratios),
      error: () => this.toast.show('Unable to reset training ratios.', 'error'),
    });
  }

  private checkHeartRate(metric: BiometricMetric | null): void {
    if (!metric) return;
    if (metric.heartRate > HEART_RATE_THRESHOLD_BPM) {
      if (!this.warningActive) {
        this.warningActive = true;
        this.toast.show(`Heart rate ${metric.heartRate} bpm exceeds zone threshold.`, 'warning');
      }
    } else {
      this.warningActive = false;
    }
  }
}
