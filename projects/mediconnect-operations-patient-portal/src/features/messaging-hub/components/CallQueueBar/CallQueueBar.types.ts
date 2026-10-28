import type { NotificationLog } from '../../../../shared/models/notification-log';

export type CallQueueBarProps = {
  pendingCalls: NotificationLog[];
  onCall: (log: NotificationLog) => void;
  onWhatsApp: (log: NotificationLog) => void;
  onMarkCompleted: (log: NotificationLog) => void;
};
