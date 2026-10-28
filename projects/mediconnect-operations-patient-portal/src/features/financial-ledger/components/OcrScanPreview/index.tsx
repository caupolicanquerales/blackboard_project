import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { OcrEditableField, OcrScanPreviewProps } from './OcrScanPreview.types';

type FieldProps = {
  label: string;
  value: string;
  field: OcrEditableField;
  onEditField: OcrScanPreviewProps['onEditField'];
  keyboardType?: 'default' | 'numeric';
};

function Field({ label, value, field, onEditField, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} accessible={false}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        testID={`ocr-field-${field}`}
        onChangeText={(text) => onEditField(field, text)}
      />
    </View>
  );
}

export function OcrScanPreview({ state, imageUri, result, onCapture, onEditField }: OcrScanPreviewProps) {
  const showFields = state === 'verified' && result !== null;
  const confidence = result ? Math.round(result.confidence * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.viewfinder} testID="ocr-viewfinder">
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : null}
        {showFields && (
          <>
            <View style={[styles.box, styles.boxVendor]} testID="ocr-box-vendor" />
            <View style={[styles.box, styles.boxTaxId]} testID="ocr-box-taxId" />
            <View style={[styles.box, styles.boxTotals]} testID="ocr-box-totals" />
          </>
        )}
        {state === 'scanning_ocr' && (
          <View style={styles.scanning}>
            <ActivityIndicator color={theme.accent} />
            <Text style={styles.scanningText}>Scanning…</Text>
          </View>
        )}
        {state === 'idle' && !imageUri && <Text style={styles.hint}>Align the receipt within the frame</Text>}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Capture receipt"
        accessibilityState={{ disabled: state === 'scanning_ocr', busy: state === 'scanning_ocr' }}
        disabled={state === 'scanning_ocr'}
        onPress={onCapture}
        style={[styles.capture, state === 'scanning_ocr' && styles.captureDisabled]}
      >
        <Text style={styles.captureText}>{state === 'verified' ? 'Rescan' : 'Capture'}</Text>
      </Pressable>

      {showFields && result && (
        <View style={styles.fields}>
          <Text
            style={styles.confidence}
            testID="ocr-confidence"
            accessibilityLabel={`Extracted fields: vendor ${result.vendorName}, tax ID ${result.taxId}, total ${result.totals}. Confidence ${confidence} percent`}
          >
            Confidence: {confidence}%
          </Text>
          <Field label="Vendor" field="vendorName" value={result.vendorName} onEditField={onEditField} />
          <Field label="Tax ID" field="taxId" value={result.taxId} onEditField={onEditField} />
          <Field label="Total" field="totals" value={String(result.totals)} keyboardType="numeric" onEditField={onEditField} />
          <Field label="Tax amount" field="taxAmount" value={String(result.taxAmount)} keyboardType="numeric" onEditField={onEditField} />
          {result.lineItems.map((item, i) => (
            <View key={i} style={styles.lineItem}>
              <Field label={`Item ${i + 1} description`} field={`lineItems.${i}.description`} value={item.description} onEditField={onEditField} />
              <Field label={`Item ${i + 1} quantity`} field={`lineItems.${i}.quantity`} value={String(item.quantity)} keyboardType="numeric" onEditField={onEditField} />
              <Field label={`Item ${i + 1} unit price`} field={`lineItems.${i}.unitPrice`} value={String(item.unitPrice)} keyboardType="numeric" onEditField={onEditField} />
              <Field label={`Item ${i + 1} total`} field={`lineItems.${i}.total`} value={String(item.total)} keyboardType="numeric" onEditField={onEditField} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const theme = {
  background: '#F8FAFC',
  accent: '#0284C7',
  text: '#0F172A',
  muted: '#475569',
  border: '#CBD5E1',
  confirmed: '#10B981',
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, gap: 8, justifyContent: 'center', alignItems: 'stretch', backgroundColor: theme.background },
  viewfinder: { height: 240, borderWidth: 2, borderColor: theme.accent, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  box: { position: 'absolute', borderWidth: 2, borderColor: theme.confirmed, borderRadius: 4 },
  boxVendor: { top: 16, left: 16, right: 16, height: 32 },
  boxTaxId: { top: 60, left: 16, width: '50%', height: 24 },
  boxTotals: { bottom: 16, right: 16, width: '40%', height: 28 },
  scanning: { alignItems: 'center', gap: 8 },
  scanningText: { color: theme.text, fontWeight: '600' },
  hint: { color: theme.muted },
  capture: { minHeight: 44, minWidth: 44, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: theme.accent },
  captureDisabled: { opacity: 0.5 },
  captureText: { fontWeight: '700', color: '#FFFFFF' },
  confidence: { marginBottom: 8, fontWeight: '700', fontSize: 16, color: theme.text },
  fields: { gap: 8 },
  field: { gap: 2 },
  label: { fontSize: 12, fontWeight: '700', color: theme.muted },
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF', color: theme.text },
  lineItem: { gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: theme.border },
});
