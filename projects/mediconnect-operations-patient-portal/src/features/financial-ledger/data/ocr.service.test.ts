import { ocrService } from './ocr.service';

describe('ocrService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const run = async (uri: string) => {
    const p = ocrService.processReceipt(uri);
    jest.advanceTimersByTime(1000);
    return p;
  };

  it('is deterministic per uri and well-formed', async () => {
    const a = await run('file:///r1.jpg');
    const b = await run('file:///r1.jpg');
    expect(a).toEqual(b);
    expect(a.confidence).toBeGreaterThanOrEqual(0);
    expect(a.confidence).toBeLessThanOrEqual(1);
    expect(a.lineItems.length).toBeGreaterThan(0);
    expect(a.totals).toBeGreaterThan(a.taxAmount);
  });

  it('resolves only after ~1s', async () => {
    const spy = jest.fn();
    ocrService.processReceipt('x').then(spy);
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
  });

  it('maps to an OCR_IMAGE expense entry', async () => {
    const uri = 'file:///r2.jpg';
    const result = await run(uri);
    const entry = ocrService.toExpenseEntry(result, uri);
    expect(entry.entryType).toBe('OCR_IMAGE');
    expect(entry.amount).toBe(result.totals);
    expect(entry.taxAmount).toBe(result.taxAmount);
    expect(entry.receiptImageUrl).toBe(uri);
    expect(entry.confidenceScore).toBe(result.confidence);
  });
});
