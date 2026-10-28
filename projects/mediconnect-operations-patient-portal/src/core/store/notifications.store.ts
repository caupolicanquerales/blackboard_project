import { create } from 'zustand';

import { messagingGatewayService } from '../services/messaging-gateway.service';
import type { DispatchState, NotificationLog } from '../../shared/models/notification-log';

interface NotificationsState {
  logs: NotificationLog[];
  dispatchState: DispatchState;
  pendingCallCount: number;
  sendWhatsApp: (appointmentId: string, phone: string, template: string) => Promise<NotificationLog>;
  requireCall: (appointmentId: string, phone: string) => NotificationLog;
  completeCall: (logId: string) => NotificationLog;
  resend: (logId: string) => Promise<NotificationLog>;
  selectPendingCalls: () => NotificationLog[];
}

const countPending = (logs: NotificationLog[]): number =>
  logs.filter((l) => l.status === 'CALL_REQUIRED').length;

const upsert = (logs: NotificationLog[], log: NotificationLog): NotificationLog[] =>
  logs.some((l) => l.id === log.id) ? logs.map((l) => (l.id === log.id ? log : l)) : [log, ...logs];

const stateFor = (logs: NotificationLog[], log: NotificationLog): DispatchState => {
  if (log.status === 'CALL_REQUIRED') return 'call_pending';
  if (log.status === 'CALL_COMPLETED') {
    return countPending(logs) > 0 ? 'call_pending' : 'call_completed';
  }
  if (log.status === 'SENT') return 'sent';
  return 'idle';
};

const seedLogs: NotificationLog[] = [
  {
    id: 'seed-log-1',
    appointmentId: 'apt-seed-1',
    channel: 'WHATSAPP',
    recipientPhone: '+5491155550001',
    messageTemplate: 'appointment_reminder',
    status: 'SENT',
    timestamp: '2026-10-27T09:00:00.000Z',
  },
  {
    id: 'seed-log-2',
    appointmentId: 'apt-seed-2',
    channel: 'WHATSAPP',
    recipientPhone: '+5491155550002',
    messageTemplate: 'appointment_reminder',
    status: 'FAILED',
    timestamp: '2026-10-27T09:05:00.000Z',
  },
  {
    id: 'seed-log-3',
    appointmentId: 'apt-seed-3',
    channel: 'DOCTOR_CALL',
    recipientPhone: '+5491155550003',
    messageTemplate: '',
    status: 'CALL_REQUIRED',
    timestamp: '2026-10-27T09:10:00.000Z',
  },
];

export const useNotificationsStore = create<NotificationsState>()((set, get) => {
  const apply = (log: NotificationLog): NotificationLog => {
    const logs = upsert(get().logs, log);
    set({ logs, pendingCallCount: countPending(logs), dispatchState: stateFor(logs, log) });
    return log;
  };

  return {
    logs: seedLogs,
    dispatchState: 'call_pending',
    pendingCallCount: countPending(seedLogs),

    async sendWhatsApp(appointmentId, phone, template) {
      set({ dispatchState: 'dispatching' });
      try {
        return apply(await messagingGatewayService.sendWhatsAppTemplate(appointmentId, phone, template));
      } catch (error) {
        set({ dispatchState: 'idle' });
        throw error;
      }
    },

    requireCall(appointmentId, phone) {
      return apply(messagingGatewayService.requireDoctorCall(appointmentId, phone));
    },

    completeCall(logId) {
      try {
        return apply(messagingGatewayService.completeCall(logId));
      } catch (error) {
        // Seeded logs are unknown to the gateway; update locally.
        const existing = get().logs.find((l) => l.id === logId);
        if (!existing) throw error;
        return apply({ ...existing, status: 'CALL_COMPLETED', timestamp: new Date().toISOString() });
      }
    },

    async resend(logId) {
      const existing = get().logs.find((l) => l.id === logId);
      set({ dispatchState: 'dispatching' });
      try {
        let log: NotificationLog;
        try {
          log = await messagingGatewayService.resend(logId);
        } catch (error) {
          if (!existing) throw error;
          log =
            existing.channel === 'DOCTOR_CALL'
              ? { ...existing, status: 'CALL_REQUIRED', timestamp: new Date().toISOString() }
              : await messagingGatewayService.sendWhatsAppTemplate(
                  existing.appointmentId,
                  existing.recipientPhone,
                  existing.messageTemplate,
                );
        }
        return apply(log);
      } catch (error) {
        set({ dispatchState: 'idle' });
        throw error;
      }
    },

    selectPendingCalls() {
      return get().logs.filter((l) => l.status === 'CALL_REQUIRED');
    },
  };
});
