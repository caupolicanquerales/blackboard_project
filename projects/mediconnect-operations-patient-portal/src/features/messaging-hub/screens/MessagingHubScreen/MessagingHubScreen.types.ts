import type { DispatchState, NotificationLog } from '../../../../shared/models/notification-log';

export type MessagingHubViewState = 'loading' | 'empty' | 'error' | 'ready';

export type MessagingHubDispatchState = DispatchState;

export type MessagingHubActionItem = {
  log: NotificationLog;
  patientName: string;
  deliveryMark: string;
};
