import type {
  ExpenseEntry,
  OcrExtractionResult,
  OcrLineItem,
} from './finance.models';

const SIMULATED_LATENCY_MS = 1000;

const VENDORS = [
  'MediSupply Corp',
  'PharmaDirect Ltd',
  'ClinicEquip Partners',
  'HealthCare Logistics',
  'BioLab Services',
];

const ITEMS = [
  'Surgical gloves (box)',
  'Disposable syringes',
  'Antiseptic solution',
  'Diagnostic test kit',
  'Sterile gauze pack',
  'Examination paper roll',
];

const TAX_RATE = 0.16;

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

const buildResult = (imageUri: string): OcrExtractionResult => {
  const hash = hashString(imageUri);
  const vendorName = VENDORS[hash % VENDORS.length];
  const taxId = `TX-${String(hash % 100000000).padStart(8, '0')}`;

  const itemCount = 1 + (hash % 3);
  const lineItems: OcrLineItem[] = [];
  for (let i = 0; i < itemCount; i += 1) {
    const h = hashString(`${imageUri}#${i}`);
    const quantity = 1 + (h % 5);
    const unitPrice = round2(5 + ((h >>> 8) % 9500) / 100);
    lineItems.push({
      description: ITEMS[h % ITEMS.length],
      quantity,
      unitPrice,
      total: round2(quantity * unitPrice),
    });
  }

  const subtotal = round2(lineItems.reduce((sum, li) => sum + li.total, 0));
  const taxAmount = round2(subtotal * TAX_RATE);
  const confidence = round2(0.6 + ((hash >>> 4) % 40) / 100);

  return {
    vendorName,
    taxId,
    totals: round2(subtotal + taxAmount),
    taxAmount,
    lineItems,
    confidence,
  };
};

export const ocrService = {
  processReceipt(imageUri: string): Promise<OcrExtractionResult> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(buildResult(imageUri)), SIMULATED_LATENCY_MS);
    });
  },

  toExpenseEntry(result: OcrExtractionResult, imageUri: string): ExpenseEntry {
    const hash = hashString(imageUri);
    return {
      id: `ocr-${hash.toString(16)}-${Date.now()}`,
      entryType: 'OCR_IMAGE',
      vendorName: result.vendorName,
      invoiceNumber: `INV-${String(hash % 1000000).padStart(6, '0')}`,
      amount: result.totals,
      taxAmount: result.taxAmount,
      category: 'Medical Supplies',
      receiptImageUrl: imageUri,
      confidenceScore: result.confidence,
      registeredAt: new Date().toISOString(),
    };
  },
};
