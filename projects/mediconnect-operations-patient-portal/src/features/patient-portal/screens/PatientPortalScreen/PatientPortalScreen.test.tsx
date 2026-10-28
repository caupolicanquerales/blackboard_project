import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PatientPortalScreen } from './index';
import { usePatientPortalStore } from '../../data/patient-portal.store';
import { useAppointmentsStore } from '../../../../core/store/appointments.store';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('PatientPortalScreen', () => {
  beforeEach(async () => {
    mockNavigate.mockClear();
    await act(async () => {
      await usePatientPortalStore.getState().load();
    });
    usePatientPortalStore.setState({ banner: null, load: jest.fn().mockResolvedValue(undefined) });
  });

  it('shows empty appointments and requests a new slot', async () => {
    await render(<PatientPortalScreen />);
    await fireEvent.press(screen.getByLabelText('Request new slot'));
    expect(screen.getByTestId('state-success')).toBeTruthy();
    expect(
      useAppointmentsStore.getState().appointments.some((a) => a.patientId === 'patient-001'),
    ).toBe(true);
  });

  it('navigates to prescription detail', async () => {
    await render(<PatientPortalScreen />);
    await fireEvent.press(screen.getByLabelText('Prescriptions'));
    await fireEvent.press(screen.getByText('Losartan'));
    expect(mockNavigate).toHaveBeenCalledWith('PrescriptionDetail', { prescriptionId: 'rx-002' });
  });

  it('renders orders inline', async () => {
    await render(<PatientPortalScreen />);
    await fireEvent.press(screen.getByLabelText('Exams/Referrals'));
    expect(screen.getByText('Cardiology consultation')).toBeTruthy();
  });

  it('toggles reminders', async () => {
    await render(<PatientPortalScreen />);
    const before = usePatientPortalStore.getState().reminders.h24;
    await fireEvent(screen.getByLabelText('Reminder 24h before'), 'valueChange', !before);
    expect(usePatientPortalStore.getState().reminders.h24).toBe(!before);
  });

  it('shows loading and error states', async () => {
    usePatientPortalStore.setState({ status: 'loading' });
    await render(<PatientPortalScreen />);
    expect(screen.getByTestId('state-loading')).toBeTruthy();
    await act(async () => usePatientPortalStore.setState({ status: 'error' }));
    expect(screen.getByTestId('state-error')).toBeTruthy();
  });

  it('shows banner and dismisses it', async () => {
    usePatientPortalStore.setState({ banner: { message: 'Hello', severity: 'info' } });
    await render(<PatientPortalScreen />);
    expect(screen.getByText('Hello')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Dismiss notification'));
    expect(screen.queryByText('Hello')).toBeNull();
  });
});
