export interface FinancialSummary {
  periodMonth: string;
  totalInvoicedAmount: number;
  totalExpensesAmount: number;
  netBalance: number;
}

export interface ExpenseEntry {
  id: string;
  entryType: 'OCR_IMAGE' | 'MANUAL';
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  category: string;
  receiptImageUrl: string | undefined;
  confidenceScore: number | undefined;
  registeredAt: string;
}

export interface OcrLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OcrExtractionResult {
  vendorName: string;
  taxId: string;
  totals: number;
  taxAmount: number;
  lineItems: OcrLineItem[];
  confidence: number;
}

export type LedgerStatus =
  | 'idle'
  | 'loading'
  | 'scanning_ocr'
  | 'verified'
  | 'saving'
  | 'error';
