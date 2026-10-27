import type { ToastSeverity } from './notification-severity';

export interface ToastNotification {
  id: string;
  message: string;
  severity: ToastSeverity;
  createdAt: string;
  timeoutMs: number;
}
