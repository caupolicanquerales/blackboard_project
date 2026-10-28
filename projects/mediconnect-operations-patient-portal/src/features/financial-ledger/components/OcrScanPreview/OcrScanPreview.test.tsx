import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OcrScanPreview } from './index';
import type { OcrExtractionResult } from '../../data/finance.models';

const result: OcrExtractionResult = {
  vendorName: 'Acme Pharma',
  taxId: '123-45',
  totals: 110,
  taxAmount: 10,
  lineItems: [{ description: 'Aspirin', quantity: 2, unitPrice: 50, total: 100 }],
  confidence: 0.92,
};

describe('OcrScanPreview', () => {
  it('calls onCapture when idle', async () => {
    const onCapture = jest.fn();
    await render(<OcrScanPreview state="idle" result={null} onCapture={onCapture} onEditField={jest.fn()} />);
    await fireEvent.press(screen.getByLabelText('Capture receipt'));
    expect(onCapture).toHaveBeenCalled();
  });

  it('shows scanning indicator and no fields', async () => {
    await render(<OcrScanPreview state="scanning_ocr" result={null} onCapture={jest.fn()} onEditField={jest.fn()} />);
    expect(screen.getByText('Scanning…')).toBeTruthy();
    expect(screen.queryByTestId('ocr-confidence')).toBeNull();
  });

  it('renders editable fields and confidence when verified', async () => {
    const onEditField = jest.fn();
    await render(<OcrScanPreview state="verified" result={result} onCapture={jest.fn()} onEditField={onEditField} />);
    expect(screen.getByText('Confidence: 92%')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('ocr-field-vendorName'), 'New');
    expect(onEditField).toHaveBeenCalledWith('vendorName', 'New');
    await fireEvent.changeText(screen.getByTestId('ocr-field-lineItems.0.description'), 'Ibuprofen');
    expect(onEditField).toHaveBeenCalledWith('lineItems.0.description', 'Ibuprofen');
  });
});
