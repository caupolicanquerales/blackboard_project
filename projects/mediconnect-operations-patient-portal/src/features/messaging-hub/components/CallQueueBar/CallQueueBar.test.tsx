import { fireEvent, render } from '@testing-library/react-native';
import type { NotificationLog } from '../../../../shared/models/notification-log';
import { CallQueueBar } from './index';

const logs: NotificationLog[] = [
  { id: '1', appointmentId: 'A1', channel: 'DOCTOR_CALL', recipientPhone: '+100', messageTemplate: 't', status: 'CALL_REQUIRED', timestamp: '2026-01-01' },
  { id: '2', appointmentId: 'A2', channel: 'WHATSAPP', recipientPhone: '+200', messageTemplate: 't', status: 'SENT', timestamp: '2026-01-01' },
];

describe('CallQueueBar', () => {
  it('shows badge count and delivery marks', async () => {
    const { getByTestId } = await render(
      <CallQueueBar pendingCalls={logs} onCall={jest.fn()} onWhatsApp={jest.fn()} onMarkCompleted={jest.fn()} />,
    );
    expect(getByTestId('pending-calls-badge').props.children.props.children).toBe(2);
    expect(getByTestId('delivery-2').props.children).toBe('✓✓');
  });

  it('fires callbacks', async () => {
    const onCall = jest.fn();
    const onWhatsApp = jest.fn();
    const onMarkCompleted = jest.fn();
    const { getByLabelText } = await render(
      <CallQueueBar pendingCalls={logs} onCall={onCall} onWhatsApp={onWhatsApp} onMarkCompleted={onMarkCompleted} />,
    );
    await fireEvent.press(getByLabelText('Call +100'));
    await fireEvent.press(getByLabelText('WhatsApp +100'));
    await fireEvent.press(getByLabelText('Mark completed +100'));
    expect(onCall).toHaveBeenCalledWith(logs[0]);
    expect(onWhatsApp).toHaveBeenCalledWith(logs[0]);
    expect(onMarkCompleted).toHaveBeenCalledWith(logs[0]);
  });
});
