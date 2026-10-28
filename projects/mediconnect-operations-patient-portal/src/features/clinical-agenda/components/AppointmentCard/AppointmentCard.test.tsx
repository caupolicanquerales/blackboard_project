import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Appointment } from '../../../../shared/models/appointment';
import { AppointmentCard } from './index';

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

const appointment: Appointment = {
  id: 'a1',
  patientId: 'p1',
  patientName: 'Jane Doe',
  patientType: 'PRIVATE',
  doctorId: 'd1',
  appointmentType: 'CONSULTATION',
  status: 'SCHEDULED',
  priorityScore: 5,
  severityLevel: 'MEDIUM',
  scheduledTime: '2026-01-01T10:00:00Z',
  durationMinutes: 30,
};

function setup() {
  const handlers = {
    onSendWhatsApp: jest.fn(),
    onRequireCall: jest.fn(),
    onReschedule: jest.fn(),
    onPress: jest.fn(),
  };
  return handlers;
}

describe('AppointmentCard', () => {
  it('shows appointment details', async () => {
    await render(<AppointmentCard appointment={appointment} {...setup()} />);
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('Consultation')).toBeTruthy();
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(screen.getByText('Scheduled')).toBeTruthy();
  });

  it('calls onPress', async () => {
    const h = setup();
    await render(<AppointmentCard appointment={appointment} {...h} />);
    await fireEvent.press(screen.getByLabelText('Appointment for Jane Doe'));
    expect(h.onPress).toHaveBeenCalledWith(appointment);
  });
});

describe('AppointmentCard swipe actions', () => {
  it('fires each action', async () => {
    const h = setup();
    await render(<AppointmentCard appointment={appointment} {...h} />);
    await fireEvent.press(screen.getByLabelText('Send WhatsApp'));
    await fireEvent.press(screen.getByLabelText('Require Call'));
    await fireEvent.press(screen.getByLabelText('Reschedule'));
    expect(h.onSendWhatsApp).toHaveBeenCalledWith(appointment);
    expect(h.onRequireCall).toHaveBeenCalledWith(appointment);
    expect(h.onReschedule).toHaveBeenCalledWith(appointment);
  });
});
