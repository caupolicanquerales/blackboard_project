export type ReceiptScannerPhase =
  | 'idle'
  | 'scanning_ocr'
  | 'verified'
  | 'saving'
  | 'error';

export type ReceiptScannerError = 'permission_denied' | 'capture_failed' | 'ocr_failed' | 'save_failed';

export const RECEIPT_SCANNER_DEFAULT_CATEGORY = 'Medical Supplies';
