import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PrescriptionDetailScreen } from './index';
import { usePatientPortalStore } from '../../data/patient-portal.store';

let mockParams = { prescriptionId: 'rx-002' };
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: mockParams }),
}));

describe('PrescriptionDetailScreen', () => {
  beforeEach(async () => {
    mockParams = { prescriptionId: 'rx-002' };
    await act(async () => {
      await usePatientPortalStore.getState().load();
    });
  });

  it('renders prescription details', async () => {
    await render(<PrescriptionDetailScreen />);
    expect(screen.getByText('Losartan')).toBeTruthy();
    expect(screen.getByText('50 mg once daily')).toBeTruthy();
    expect(screen.getByText('Dr. Ana Beltrán')).toBeTruthy();
    expect(screen.getByTestId('pharmacy-status').props.children).toBe('Dispatched to pharmacy');
  });

  it('shows empty state for unknown id', async () => {
    mockParams = { prescriptionId: 'missing' };
    await render(<PrescriptionDetailScreen />);
    expect(screen.getByTestId('state-empty')).toBeTruthy();
  });

  it('shows loading state', async () => {
    usePatientPortalStore.setState({ status: 'loading', prescriptions: [] });
    usePatientPortalStore.setState({ load: jest.fn().mockResolvedValue(undefined) });
    await render(<PrescriptionDetailScreen />);
    expect(screen.getByTestId('state-loading')).toBeTruthy();
  });

  it('shows error state and retries', async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    usePatientPortalStore.setState({ status: 'error', load });
    await render(<PrescriptionDetailScreen />);
    expect(screen.getByTestId('state-error')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Retry'));
    expect(load).toHaveBeenCalled();
  });
});
