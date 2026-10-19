import { Injectable, signal } from '@angular/core';

import { Toast, ToastSeverity } from '../models/toast.model';

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 5;

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private counter = 0;

  readonly toasts = this._toasts.asReadonly();

  show(message: string, severity: ToastSeverity): string {
    const id = `toast-${Date.now()}-${++this.counter}`;
    const toast: Toast = { id, message, severity, createdAt: Date.now() };

    const next = [...this._toasts(), toast];
    const overflow = next.length - MAX_VISIBLE;
    if (overflow > 0) {
      next.slice(0, overflow).forEach((t) => this.clearTimer(t.id));
    }
    this._toasts.set(overflow > 0 ? next.slice(overflow) : next);

    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS),
    );
    return id;
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this._toasts.set([]);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
