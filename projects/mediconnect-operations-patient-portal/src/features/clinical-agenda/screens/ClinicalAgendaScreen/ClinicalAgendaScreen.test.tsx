import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ClinicalAgendaScreen } from './index';
import { useAppointmentsStore } from '../../../../core/store/appointments.store';
import { useSessionStore } from '../../../../core/store/session.store';
import type { Appointment } from '../../../../shared/models/appointment';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, renderRightActions }: { children: React.ReactNode; renderRightActions: () => React.ReactNode }) => (
      <View>
        {children}
        {renderRightActions()}
      </View>
    ),
  };
});

const base: Appointment = {
  id: 'T-1',
  patientId: 'P-1',
  patientName: 'Test Patient',
  patientType: 'PRIVATE',
  doctorId: 'D-01',
  appointmentType: 'CONSULTATION',
  status: 'PENDING_TRIAGE',
  priorityScore: 5,
  severityLevel: 'MEDIUM',
  scheduledTime: '',
  durationMinutes: 30,
};

describe('ClinicalAgendaScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useSessionStore.getState().setRole('DOCTOR');
    useAppointmentsStore.setState({
      appointments: [base],
      status: 'success',
      viewFilter: 'CONSULTATION',
      load: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders appointments in success state', async () => {
    await render(<ClinicalAgendaScreen />);
    expect(screen.getByText('Test Patient')).toBeTruthy();
  });

  it('renders loading, error and empty states', async () => {
    useAppointmentsStore.setState({ status: 'loading', appointments: [] });
    const { rerender } = await render(<ClinicalAgendaScreen />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    await act(async () => useAppointmentsStore.setState({ status: 'error' }));
    await rerender(<ClinicalAgendaScreen />);
    expect(screen.getByText('Retry')).toBeTruthy();
    await act(async () => useAppointmentsStore.setState({ status: 'empty' }));
    expect(screen.getByText('No appointments to show.')).toBeTruthy();
  });

  it('switches the consultations/surgical filter', async () => {
    await render(<ClinicalAgendaScreen />);
    await fireEvent.press(screen.getByLabelText('Surgical procedures'));
    expect(useAppointmentsStore.getState().viewFilter).toBe('SURGICAL_PROCEDURE');
    expect(screen.queryByText('Test Patient')).toBeNull();
  });

  it('confirms schedule override before navigating', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<ClinicalAgendaScreen />);
    await fireEvent.press(screen.getByLabelText('Reschedule'));
    const buttons = alertSpy.mock.calls[0][2] ?? [];
    buttons.find((b) => b.text === 'Override')?.onPress?.();
    expect(mockNavigate).toHaveBeenCalledWith('AppointmentModifier', { appointmentId: 'T-1' });
    alertSpy.mockRestore();
  });

  it('shows a toast for a new high-priority patient', async () => {
    await render(<ClinicalAgendaScreen />);
    await act(async () =>
      useAppointmentsStore.setState({
        appointments: [base, { ...base, id: 'T-2', patientName: 'Urgent One', severityLevel: 'URGENT', priorityScore: 10 }],
      }),
    );
    expect(screen.getByText('New high-priority patient: Urgent One')).toBeTruthy();
  });

  it('blocks access for patient roles', async () => {
    useSessionStore.getState().setRole('PATIENT_PRIVATE');
    await render(<ClinicalAgendaScreen />);
    expect(screen.getByText('You do not have access to the clinical agenda.')).toBeTruthy();
  });
});
