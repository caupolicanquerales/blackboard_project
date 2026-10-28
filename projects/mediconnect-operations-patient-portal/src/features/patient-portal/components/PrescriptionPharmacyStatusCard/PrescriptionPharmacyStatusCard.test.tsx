import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Prescription } from '../../../../shared/models/patient';
import { PrescriptionPharmacyStatusCard } from './index';

const prescription: Prescription = {
  id: 'rx1',
  patientId: 'p1',
  medicationName: 'Amoxicillin',
  dosage: '500mg',
  instructions: 'Twice daily',
  pharmacyStatus: 'READY_FOR_PICKUP',
  issuedAt: '2026-01-01',
  issuingDoctor: 'Dr. House',
};

describe('PrescriptionPharmacyStatusCard', () => {
  it('renders details and status chip', async () => {
    await render(<PrescriptionPharmacyStatusCard prescription={prescription} onPress={jest.fn()} />);
    expect(screen.getByText('Amoxicillin')).toBeTruthy();
    expect(screen.getByText('500mg')).toBeTruthy();
    expect(screen.getByText('Dr. House')).toBeTruthy();
    expect(screen.getByText('Ready for pickup')).toBeTruthy();
  });

  it('is an accessible button and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<PrescriptionPharmacyStatusCard prescription={prescription} onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Amoxicillin, Ready for pickup' });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledWith(prescription);
  });
});
