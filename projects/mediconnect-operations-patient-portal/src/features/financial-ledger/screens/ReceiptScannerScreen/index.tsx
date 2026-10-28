import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ocrService } from '../../data/ocr.service';
import { useLedgerStore } from '../../data/ledger.store';
import type { ExpenseEntry, OcrExtractionResult } from '../../data/finance.models';
import { OcrScanPreview } from '../../components/OcrScanPreview';
import type { OcrEditableField } from '../../components/OcrScanPreview/OcrScanPreview.types';
import type { FinancialLedgerStackParamList } from '../../../../core/navigation/types';
import { theme } from '../../../../shared/theme/theme';
import { RECEIPT_SCANNER_DEFAULT_CATEGORY } from './ReceiptScannerScreen.types';
import type { ReceiptScannerError } from './ReceiptScannerScreen.types';

type Navigation = NativeStackNavigationProp<FinancialLedgerStackParamList, 'ReceiptScanner'>;

const ERROR_MESSAGES: Record<ReceiptScannerError, string> = {
  permission_denied: 'Camera permission denied. Enable camera access in settings to scan receipts.',
  capture_failed: 'Could not capture the receipt. Please try again.',
  ocr_failed: 'Could not read the receipt. Please try again.',
  save_failed: 'Could not save the expense. Please try again.',
};

const toNumber = (value: string): number => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const applyEdit = (
  draft: OcrExtractionResult,
  field: OcrEditableField,
  value: string,
): OcrExtractionResult => {
  const match = /^lineItems\.(\d+)\.(description|quantity|unitPrice|total)$/.exec(field);
  if (match) {
    const index = Number(match[1]);
    const key = match[2] as 'description' | 'quantity' | 'unitPrice' | 'total';
    const lineItems = draft.lineItems.map((item, i) =>
      i === index ? { ...item, [key]: key === 'description' ? value : toNumber(value) } : item,
    );
    return { ...draft, lineItems };
  }
  if (field === 'vendorName' || field === 'taxId') return { ...draft, [field]: value };
  return { ...draft, [field as 'totals' | 'taxAmount']: toNumber(value) };
};

export function ReceiptScannerScreen() {
  const navigation = useNavigation<Navigation>();
  const draft = useLedgerStore((s) => s.draft);
  const status = useLedgerStore((s) => s.status);
  const setDraft = useLedgerStore((s) => s.setDraft);
  const saveExpense = useLedgerStore((s) => s.saveExpense);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<ReceiptScannerError | null>(null);

  const handleCapture = useCallback(async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('permission_denied');
        return;
      }
      const picked = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (picked.canceled || !picked.assets || picked.assets.length === 0) return;
      const uri = picked.assets[0].uri;
      setImageUri(uri);
      setScanning(true);
      try {
        const result = await ocrService.processReceipt(uri);
        setDraft(result);
      } catch {
        setError('ocr_failed');
      } finally {
        setScanning(false);
      }
    } catch {
      setError('capture_failed');
    }
  }, [setDraft]);

  const handleEditField = useCallback(
    (field: OcrEditableField, value: string) => {
      const current = useLedgerStore.getState().draft;
      if (current) setDraft(applyEdit(current, field, value));
    },
    [setDraft],
  );

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setError(null);
    const entry: ExpenseEntry = {
      id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      entryType: 'OCR_IMAGE',
      vendorName: draft.vendorName,
      invoiceNumber: draft.taxId,
      amount: draft.totals,
      taxAmount: draft.taxAmount,
      category: RECEIPT_SCANNER_DEFAULT_CATEGORY,
      receiptImageUrl: imageUri,
      confidenceScore: draft.confidence,
      registeredAt: new Date().toISOString(),
    };
    await saveExpense(entry);
    if (useLedgerStore.getState().status === 'error') {
      setError('save_failed');
      return;
    }
    navigation.goBack();
  }, [draft, imageUri, saveExpense, navigation]);

  const previewState = scanning || status === 'scanning_ocr' ? 'scanning_ocr' : draft ? 'verified' : 'idle';
  const saving = status === 'saving';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <OcrScanPreview
          state={previewState}
          imageUri={imageUri}
          result={draft}
          onCapture={handleCapture}
          onEditField={handleEditField}
        />
        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert" testID="scanner-error">
            <Text style={styles.errorText}>{ERROR_MESSAGES[error]}</Text>
          </View>
        ) : null}
        {draft ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save receipt"
            disabled={saving}
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveDisabled]}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 12 },
  errorBox: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.error },
  errorText: { color: theme.colors.error },
  saveButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: theme.colors.onAccent, fontWeight: '700' },
});
