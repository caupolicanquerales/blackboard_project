import type { LedgerStatus } from '../../data/finance.models';

export type FinancialLedgerScreenState = Extract<
  LedgerStatus,
  'loading' | 'scanning_ocr' | 'verified' | 'saving' | 'error'
>;

export type ExpenseFormValues = {
  vendorName: string;
  invoiceNumber: string;
  amount: string;
  taxAmount: string;
  category: string;
};

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export const SWIPE_DELETE_THRESHOLD = 80;
