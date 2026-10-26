import { Injectable, signal } from '@angular/core';
import { Toast, ToastSeverity } from '../models/toast.model';

const DEFAULT_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private counter = 0;

  show(message: string, severity: ToastSeverity = 'info', durationMs: number = DEFAULT_DURATION_MS): string {
    const id = `toast-${Date.now()}-${++this.counter}`;
    this._toasts.update((list) => [...list, { id, message, severity, durationMs }]);
    if (durationMs > 0) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), durationMs));
    }
    return id;
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this._toasts.set([]);
  }
}
