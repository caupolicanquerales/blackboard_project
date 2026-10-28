import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppointmentModifierScreen } from './index';
import { useAppointmentsStore } from '../../../../core/store/appointments.store';

const mockGoBack = jest.fn();
let mockParams = { appointmentId: 'A-001' };

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: mockParams }),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

describe('AppointmentModifierScreen', () => {
  beforeEach(() => {
    mockParams = { appointmentId: 'A-001' };
    mockGoBack.mockClear();
    useAppointmentsStore.setState({ status: 'success' });
  });

  it('renders empty state for unknown appointment', async () => {
    mockParams = { appointmentId: 'nope' };
    await render(<AppointmentModifierScreen />);
    expect(screen.getByText('Appointment not found.')).toBeTruthy();
  });

  it('renders loading and error states', async () => {
    useAppointmentsStore.setState({ status: 'loading' });
    const { rerender } = await render(<AppointmentModifierScreen />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    useAppointmentsStore.setState({ status: 'error' });
    await rerender(<AppointmentModifierScreen />);
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('saves a free slot without confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await render(<AppointmentModifierScreen />);
    await fireEvent.press(screen.getByText('2026-11-02T10:00:00Z'));
    await fireEvent.press(screen.getByText('Save'));
    expect(alert).not.toHaveBeenCalled();
    expect(useAppointmentsStore.getState().appointments.find((a) => a.id === 'A-001')?.scheduledTime).toBe(
      '2026-11-02T10:00:00Z',
    );
    expect(screen.getByText('Appointment updated.')).toBeTruthy();
  });

  it('asks for confirmation on a blocked slot and saves on override', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<AppointmentModifierScreen />);
    await fireEvent.press(screen.getByText('2026-11-02T09:00:00Z (blocked)'));
    await fireEvent.press(screen.getByText('Save'));
    expect(alert).toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      buttons.find((b) => b.text === 'Override')?.onPress?.();
    });
    expect(useAppointmentsStore.getState().appointments.find((a) => a.id === 'A-001')?.scheduledTime).toBe(
      '2026-11-02T09:00:00Z',
    );
  });

  it('reassigns doctor', async () => {
    await render(<AppointmentModifierScreen />);
    await fireEvent.press(screen.getByText('Dr. Martín Castro'));
    await fireEvent.press(screen.getByText('2026-11-02T14:00:00Z'));
    await fireEvent.press(screen.getByText('Save'));
    expect(useAppointmentsStore.getState().appointments.find((a) => a.id === 'A-001')?.doctorId).toBe('D-02');
  });
});
