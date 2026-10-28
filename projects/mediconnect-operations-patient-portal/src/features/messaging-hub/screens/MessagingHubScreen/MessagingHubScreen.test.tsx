import { Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MessagingHubScreen } from './index';
import { useNotificationsStore } from '../../../../core/store/notifications.store';
import { useAppointmentsStore } from '../../../../core/store/appointments.store';
import type { NotificationLog } from '../../../../shared/models/notification-log';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const logs: NotificationLog[] = [
  { id: 'l1', appointmentId: 'a1', channel: 'WHATSAPP', recipientPhone: '+5491100000001', messageTemplate: 'hi', status: 'SENT', timestamp: '' },
  { id: 'l2', appointmentId: 'a2', channel: 'DOCTOR_CALL', recipientPhone: '+5491100000002', messageTemplate: '', status: 'CALL_REQUIRED', timestamp: '' },
  { id: 'l3', appointmentId: 'a3', channel: 'WHATSAPP', recipientPhone: '+5491100000003', messageTemplate: 'hi', status: 'FAILED', timestamp: '' },
];

describe('MessagingHubScreen', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
    useNotificationsStore.setState({ logs, dispatchState: 'call_pending', pendingCallCount: 1 });
    useAppointmentsStore.setState({
      status: 'success',
      appointments: [{ id: 'a1', patientId: 'p1', patientName: 'Ana Gomez', patientType: 'PRIVATE', doctorId: 'D-01', appointmentType: 'CONSULTATION', status: 'SCHEDULED', priorityScore: 1, severityLevel: 'ROUTINE', scheduledTime: '', durationMinutes: 30 }],
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('renders patient names and delivery marks', async () => {
    await render(<MessagingHubScreen />);
    expect(screen.getByText('Ana Gomez')).toBeTruthy();
    expect(screen.getByTestId('delivery-l1').props.children).toBe('✓✓');
    expect(screen.getByTestId('call-queue-bar')).toBeTruthy();
  });

  it('opens dialer for pending call', async () => {
    await render(<MessagingHubScreen />);
    await fireEvent.press(screen.getByLabelText('Call +5491100000002'));
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+5491100000002');
  });

  it('logs call completed', async () => {
    await render(<MessagingHubScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Mark completed +5491100000002'));
    });
    expect(useNotificationsStore.getState().logs.find((l) => l.id === 'l2')?.status).toBe('CALL_COMPLETED');
  });

  it('resends failed log', async () => {
    const resend = jest.fn().mockResolvedValue(logs[2]);
    useNotificationsStore.setState({ resend });
    await render(<MessagingHubScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Resend l3'));
    });
    expect(resend).toHaveBeenCalledWith('l3');
  });

  it('shows empty and error states', async () => {
    useNotificationsStore.setState({ logs: [], pendingCallCount: 0 });
    const { unmount } = await render(<MessagingHubScreen />);
    expect(screen.getByTestId('state-empty')).toBeTruthy();
    await unmount();
    useAppointmentsStore.setState({ status: 'error' });
    await render(<MessagingHubScreen />);
    expect(screen.getByTestId('state-error')).toBeTruthy();
  });
});
