import { Injectable, Signal, signal } from '@angular/core';
import { Notification, ToastSeverity } from '../models/notification.model';

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private readonly state = signal<readonly Notification[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private counter = 0;

  readonly toasts: Signal<readonly Notification[]> = this.state.asReadonly();

  show(message: string, severity: ToastSeverity): string {
    const id = `toast-${Date.now()}-${++this.counter}`;
    const toast: Notification = {
      id,
      message,
      severity,
      createdAt: new Date().toISOString(),
    };
    this.state.update((list) => [...list, toast]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS),
    );
    return id;
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.state.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.state.set([]);
  }
}
