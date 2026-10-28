import { messagingGatewayService as svc } from './messaging-gateway.service';

describe('messagingGatewayService', () => {
  beforeEach(() => svc.__configure({ failureRate: 0, random: () => 0.5 }));

  it('sends WhatsApp template as SENT', async () => {
    const log = await svc.sendWhatsAppTemplate('a1', '+54 9 11 1234', 'hello');
    expect(log.status).toBe('SENT');
    expect(log.channel).toBe('WHATSAPP');
  });

  it('can simulate FAILED and resend', async () => {
    svc.__configure({ failureRate: 1 });
    const failed = await svc.sendWhatsAppTemplate('a1', '123', 'hi');
    expect(failed.status).toBe('FAILED');
    svc.__configure({ failureRate: 0 });
    const again = await svc.resend(failed.id);
    expect(again.status).toBe('SENT');
    expect(again.messageTemplate).toBe('hi');
  });

  it('handles doctor call flow', () => {
    const log = svc.requireDoctorCall('a2', '555');
    expect(log.status).toBe('CALL_REQUIRED');
    expect(svc.completeCall(log.id).status).toBe('CALL_COMPLETED');
    expect(() => svc.completeCall('nope')).toThrow();
  });

  it('builds urls', () => {
    expect(svc.buildWhatsAppUrl('+54 9 11-1234', 'a b')).toBe('https://wa.me/549111234?text=a%20b');
    expect(svc.buildDialerUrl('+54 (9) 11-1234')).toBe('tel:+549111234');
  });
});
