import type { NotificationLog } from '../../shared/models/notification-log';

const logs = new Map<string, NotificationLog>();
let counter = 0;
let failureRate = 0.1;
let randomFn: () => number = Math.random;

const nextId = (): string => {
  counter += 1;
  return `log-${Date.now()}-${counter}`;
};

const digits = (phone: string): string => phone.replace(/\D/g, '');

const store = (log: NotificationLog): NotificationLog => {
  logs.set(log.id, log);
  return log;
};

const getOrThrow = (logId: string): NotificationLog => {
  const log = logs.get(logId);
  if (!log) {
    throw new Error(`Notification log not found: ${logId}`);
  }
  return log;
};

export const messagingGatewayService = {
  async sendWhatsAppTemplate(
    appointmentId: string,
    recipientPhone: string,
    template: string,
  ): Promise<NotificationLog> {
    await Promise.resolve();
    const failed = randomFn() < failureRate;
    return store({
      id: nextId(),
      appointmentId,
      channel: 'WHATSAPP',
      recipientPhone,
      messageTemplate: template,
      status: failed ? 'FAILED' : 'SENT',
      timestamp: new Date().toISOString(),
    });
  },

  requireDoctorCall(appointmentId: string, recipientPhone: string): NotificationLog {
    return store({
      id: nextId(),
      appointmentId,
      channel: 'DOCTOR_CALL',
      recipientPhone,
      messageTemplate: '',
      status: 'CALL_REQUIRED',
      timestamp: new Date().toISOString(),
    });
  },

  completeCall(logId: string): NotificationLog {
    const log = getOrThrow(logId);
    return store({ ...log, status: 'CALL_COMPLETED', timestamp: new Date().toISOString() });
  },

  async resend(logId: string): Promise<NotificationLog> {
    const log = getOrThrow(logId);
    if (log.channel === 'DOCTOR_CALL') {
      return store({ ...log, status: 'CALL_REQUIRED', timestamp: new Date().toISOString() });
    }
    return messagingGatewayService.sendWhatsAppTemplate(
      log.appointmentId,
      log.recipientPhone,
      log.messageTemplate,
    );
  },

  buildWhatsAppUrl(phone: string, text: string): string {
    return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}`;
  },

  buildDialerUrl(phone: string): string {
    const cleaned = phone.trim().replace(/[^\d+]/g, '');
    return `tel:${cleaned}`;
  },

  // Test hook to control simulated failures.
  __configure(options: { failureRate?: number; random?: () => number }): void {
    if (options.failureRate !== undefined) failureRate = options.failureRate;
    if (options.random) randomFn = options.random;
  },
};
