import { create } from 'zustand';
import { config } from '../config';
import type { ToastNotification } from '../models/notification';
import type { ToastSeverity } from '../models/notification-severity';

interface NotificationState {
  queue: ToastNotification[];
  push: (message: string, severity: ToastSeverity, timeoutMs?: number) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
let counter = 0;

function clearTimer(id: string): void {
  const t = timers.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    timers.delete(id);
  }
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  queue: [],
  push: (message, severity, timeoutMs) => {
    const { queue } = get();
    const last = queue[queue.length - 1];
    if (last && last.message === message && last.severity === severity) return;

    counter += 1;
    const id = `toast-${Date.now()}-${counter}`;
    const timeout = timeoutMs ?? config.TOAST_DEFAULT_TIMEOUT_MS;
    const toast: ToastNotification = {
      id,
      message,
      severity,
      createdAt: new Date().toISOString(),
      timeoutMs: timeout,
    };
    set((s) => ({ queue: [...s.queue, toast] }));

    if (timeout > 0) {
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          set((s) => ({ queue: s.queue.filter((n) => n.id !== id) }));
        }, timeout),
      );
    }
  },
  dismiss: (id) => {
    clearTimer(id);
    set((s) => ({ queue: s.queue.filter((n) => n.id !== id) }));
  },
  clear: () => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    set({ queue: [] });
  },
}));
