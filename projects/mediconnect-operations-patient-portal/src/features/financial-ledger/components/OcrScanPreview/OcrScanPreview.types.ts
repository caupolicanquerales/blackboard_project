import type { OcrExtractionResult } from '../../data/finance.models';

export type OcrScanPreviewState = 'idle' | 'scanning_ocr' | 'verified';

export type OcrEditableField =
  | 'vendorName'
  | 'taxId'
  | 'totals'
  | 'taxAmount'
  | `lineItems.${number}.description`
  | `lineItems.${number}.quantity`
  | `lineItems.${number}.unitPrice`
  | `lineItems.${number}.total`;

export type OcrScanPreviewProps = {
  state: OcrScanPreviewState;
  imageUri?: string;
  result: OcrExtractionResult | null;
  onCapture: () => void;
  onEditField: (field: OcrEditableField, value: string) => void;
};
