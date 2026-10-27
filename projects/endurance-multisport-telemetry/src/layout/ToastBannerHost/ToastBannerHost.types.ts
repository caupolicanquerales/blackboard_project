import type { ToastNotification } from '../../core/models/notification';

export type ToastBannerHostProps = {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
};
