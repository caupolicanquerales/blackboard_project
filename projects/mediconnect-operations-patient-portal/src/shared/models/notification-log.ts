export type NotificationChannel = 'WHATSAPP' | 'DOCTOR_CALL';

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'CALL_REQUIRED'
  | 'CALL_COMPLETED';

export type DispatchState =
  | 'idle'
  | 'dispatching'
  | 'sent'
  | 'call_pending'
  | 'call_completed';

export interface NotificationLog {
  id: string;
  appointmentId: string;
  channel: NotificationChannel;
  recipientPhone: string;
  messageTemplate: string;
  status: NotificationStatus;
  timestamp: string;
}
