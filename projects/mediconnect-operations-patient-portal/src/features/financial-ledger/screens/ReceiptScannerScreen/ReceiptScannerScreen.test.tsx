import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ReceiptScannerScreen } from './index';
import { useLedgerStore } from '../../data/ledger.store';
import { ocrService } from '../../data/ocr.service';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;

const result = {
  vendorName: 'Acme',
  taxId: 'T-1',
  totals: 100,
  taxAmount: 16,
  lineItems: [{ description: 'Gloves', quantity: 1, unitPrice: 100, total: 100 }],
  confidence: 0.9,
};

describe('ReceiptScannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLedgerStore.getState().setDraft(null);
  });

  it('shows error on permission denial', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
    await render(<ReceiptScannerScreen />);
    await fireEvent.press(screen.getByLabelText(/capture|scan/i));
    expect(await screen.findByTestId('scanner-error')).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('captures, scans, edits and saves', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://r.jpg' }],
    } as never);
    jest.spyOn(ocrService, 'processReceipt').mockResolvedValue(result);
    const before = useLedgerStore.getState().expenses.length;
    await render(<ReceiptScannerScreen />);
    await fireEvent.press(screen.getByLabelText(/capture|scan/i));
    const vendor = await screen.findByTestId('ocr-field-vendorName');
    await fireEvent.changeText(vendor, 'Edited');
    await fireEvent.press(screen.getByLabelText('Save receipt'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    const { expenses } = useLedgerStore.getState();
    expect(expenses.length).toBe(before + 1);
    expect(expenses[0].vendorName).toBe('Edited');
  });

  it('shows error when OCR fails', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://r.jpg' }],
    } as never);
    jest.spyOn(ocrService, 'processReceipt').mockRejectedValue(new Error('x'));
    await render(<ReceiptScannerScreen />);
    await fireEvent.press(screen.getByLabelText(/capture|scan/i));
    expect(await screen.findByTestId('scanner-error')).toBeTruthy();
  });
});
