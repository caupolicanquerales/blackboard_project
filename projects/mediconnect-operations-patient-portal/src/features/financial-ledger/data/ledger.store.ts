import { create } from 'zustand';
import type {
  ExpenseEntry,
  FinancialSummary,
  LedgerStatus,
  OcrExtractionResult,
} from './finance.models';

export type ManualExpenseInput = Omit<
  ExpenseEntry,
  'id' | 'entryType' | 'receiptImageUrl' | 'confidenceScore' | 'registeredAt'
>;

interface LedgerState {
  summary: FinancialSummary;
  expenses: ExpenseEntry[];
  status: LedgerStatus;
  draft: OcrExtractionResult | null;
  loadSummary: (periodMonth: string) => Promise<void>;
  setDraft: (result: OcrExtractionResult | null) => void;
  updateDraftField: <K extends keyof OcrExtractionResult>(
    field: K,
    value: OcrExtractionResult[K],
  ) => void;
  saveExpense: (entry: ExpenseEntry) => Promise<void>;
  createManualExpense: (input: ManualExpenseInput) => ExpenseEntry;
  editExpense: (id: string, changes: Partial<Omit<ExpenseEntry, 'id'>>) => void;
  deleteExpense: (id: string) => void;
}

const SEED_INVOICED_AMOUNT = 12500;

const SEED_EXPENSES: ExpenseEntry[] = [
  {
    id: 'exp-seed-001',
    entryType: 'OCR_IMAGE',
    vendorName: 'MedSupply Co.',
    invoiceNumber: 'INV-1001',
    amount: 1850.5,
    taxAmount: 295.5,
    category: 'Medical Supplies',
    receiptImageUrl: undefined,
    confidenceScore: 0.94,
    registeredAt: new Date().toISOString(),
  },
  {
    id: 'exp-seed-002',
    entryType: 'MANUAL',
    vendorName: 'CleanCare Services',
    invoiceNumber: 'INV-2044',
    amount: 420,
    taxAmount: 67.2,
    category: 'Maintenance',
    receiptImageUrl: undefined,
    confidenceScore: undefined,
    registeredAt: new Date().toISOString(),
  },
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

const buildSummary = (
  periodMonth: string,
  expenses: ExpenseEntry[],
  invoiced: number,
): FinancialSummary => {
  const totalExpensesAmount = round2(
    expenses.reduce((acc, e) => acc + e.amount, 0),
  );
  return {
    periodMonth,
    totalInvoicedAmount: invoiced,
    totalExpensesAmount,
    netBalance: round2(invoiced - totalExpensesAmount),
  };
};

const currentMonth = (): string => new Date().toISOString().slice(0, 7);

const newId = (): string =>
  `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useLedgerStore = create<LedgerState>()((set, get) => ({
  summary: buildSummary(currentMonth(), SEED_EXPENSES, SEED_INVOICED_AMOUNT),
  expenses: SEED_EXPENSES,
  status: 'idle',
  draft: null,

  loadSummary: async (periodMonth) => {
    set({ status: 'loading' });
    const { expenses, summary } = get();
    set({
      summary: buildSummary(periodMonth, expenses, summary.totalInvoicedAmount),
      status: 'idle',
    });
  },

  setDraft: (result) => set({ draft: result, status: result ? 'verified' : 'idle' }),

  updateDraftField: (field, value) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, [field]: value } } : {},
    ),

  saveExpense: async (entry) => {
    set({ status: 'saving' });
    try {
      const { expenses, summary } = get();
      const exists = expenses.some((e) => e.id === entry.id);
      const next = exists
        ? expenses.map((e) => (e.id === entry.id ? entry : e))
        : [entry, ...expenses];
      set({
        expenses: next,
        summary: buildSummary(summary.periodMonth, next, summary.totalInvoicedAmount),
        draft: null,
        status: 'verified',
      });
    } catch {
      set({ status: 'error' });
    }
  },

  createManualExpense: (input) => {
    const entry: ExpenseEntry = {
      ...input,
      id: newId(),
      entryType: 'MANUAL',
      receiptImageUrl: undefined,
      confidenceScore: undefined,
      registeredAt: new Date().toISOString(),
    };
    const { expenses, summary } = get();
    const next = [entry, ...expenses];
    set({
      expenses: next,
      summary: buildSummary(summary.periodMonth, next, summary.totalInvoicedAmount),
    });
    return entry;
  },

  editExpense: (id, changes) => {
    const { expenses, summary } = get();
    const next = expenses.map((e) => (e.id === id ? { ...e, ...changes, id } : e));
    set({
      expenses: next,
      summary: buildSummary(summary.periodMonth, next, summary.totalInvoicedAmount),
    });
  },

  deleteExpense: (id) => {
    const { expenses, summary } = get();
    const target = expenses.find((e) => e.id === id);
    if (!target || target.entryType !== 'MANUAL') return;
    const next = expenses.filter((e) => e.id !== id);
    set({
      expenses: next,
      summary: buildSummary(summary.periodMonth, next, summary.totalInvoicedAmount),
    });
  },
}));
