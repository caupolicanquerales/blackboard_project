export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  severity: ToastSeverity;
  createdAt: string;
}
