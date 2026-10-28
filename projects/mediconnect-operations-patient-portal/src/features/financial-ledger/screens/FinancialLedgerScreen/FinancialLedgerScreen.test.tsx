import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FinancialLedgerScreen } from './index';
import { useLedgerStore } from '../../data/ledger.store';
import { useSessionStore } from '../../../../core/store/session.store';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('FinancialLedgerScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useSessionStore.getState().setRole('SECRETARY');
  });

  it('renders summary and expenses', async () => {
    await render(<FinancialLedgerScreen />);
    expect(screen.getByTestId('summary-invoiced')).toBeTruthy();
    expect(screen.getByText('MedSupply Co.')).toBeTruthy();
    expect(screen.getByText('CleanCare Services')).toBeTruthy();
  });

  it('navigates to ReceiptScanner from FAB', async () => {
    await render(<FinancialLedgerScreen />);
    await fireEvent.press(screen.getByLabelText('Scan receipt'));
    expect(mockNavigate).toHaveBeenCalledWith('ReceiptScanner');
  });

  it('deletes only MANUAL entries', async () => {
    await render(<FinancialLedgerScreen />);
    const act1 = { nativeEvent: { actionName: 'delete' } };
    const invoke = async (id: string) => {
      const row = screen.getByTestId(`expense-row-${id}`);
      await act(async () => row.props.onAccessibilityAction(act1));
    };
    await invoke('exp-seed-001');
    expect(useLedgerStore.getState().expenses.some((e) => e.id === 'exp-seed-001')).toBe(true);
    await invoke('exp-seed-002');
    expect(useLedgerStore.getState().expenses.some((e) => e.id === 'exp-seed-002')).toBe(false);
  });

  it('validates and creates a manual expense', async () => {
    await render(<FinancialLedgerScreen />);
    await fireEvent.press(screen.getByLabelText('Add manual expense'));
    await fireEvent.press(screen.getByLabelText('Save expense'));
    expect(screen.getByText('Vendor is required')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('expense-form-vendorName'), 'Acme');
    await fireEvent.changeText(screen.getByTestId('expense-form-invoiceNumber'), 'X-1');
    await fireEvent.changeText(screen.getByTestId('expense-form-amount'), '50');
    await fireEvent.changeText(screen.getByTestId('expense-form-category'), 'Misc');
    await fireEvent.press(screen.getByLabelText('Save expense'));
    expect(useLedgerStore.getState().expenses.some((e) => e.vendorName === 'Acme')).toBe(true);
  });

  it('hides amounts and write actions without access', async () => {
    useSessionStore.getState().setRole('DOCTOR');
    await render(<FinancialLedgerScreen />);
    expect(screen.getByTestId('summary-invoiced').props.children).toBe('••••');
    expect(screen.queryByLabelText('Scan receipt')).toBeNull();
  });
});
