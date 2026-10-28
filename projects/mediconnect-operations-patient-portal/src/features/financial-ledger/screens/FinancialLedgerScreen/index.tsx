import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLedgerStore } from '../../data/ledger.store';
import type { ExpenseEntry } from '../../data/finance.models';
import { useSessionStore } from '../../../../core/store/session.store';
import type { FinancialLedgerStackParamList } from '../../../../core/navigation/types';
import { theme } from '../../../../shared/theme/theme';
import { SWIPE_DELETE_THRESHOLD } from './FinancialLedgerScreen.types';
import type {
  ExpenseFormErrors,
  ExpenseFormValues,
  FinancialLedgerScreenState,
} from './FinancialLedgerScreen.types';

type Navigation = NativeStackNavigationProp<FinancialLedgerStackParamList, 'FinancialLedgerHome'>;

const EMPTY_FORM: ExpenseFormValues = {
  vendorName: '',
  invoiceNumber: '',
  amount: '',
  taxAmount: '',
  category: '',
};

const money = (n: number): string => `$${n.toFixed(2)}`;

const validate = (v: ExpenseFormValues): ExpenseFormErrors => {
  const errors: ExpenseFormErrors = {};
  if (!v.vendorName.trim()) errors.vendorName = 'Vendor is required';
  if (!v.invoiceNumber.trim()) errors.invoiceNumber = 'Invoice number is required';
  const amount = Number(v.amount);
  if (v.amount.trim() === '' || Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount';
  }
  const tax = Number(v.taxAmount === '' ? '0' : v.taxAmount);
  if (Number.isNaN(tax) || tax < 0) errors.taxAmount = 'Enter a valid tax amount';
  if (!v.category.trim()) errors.category = 'Category is required';
  return errors;
};

type RowProps = {
  item: ExpenseEntry;
  canView: boolean;
  onEdit: (item: ExpenseEntry) => void;
  onDelete: (id: string) => void;
};

function ExpenseRow({ item, canView, onEdit, onDelete }: RowProps) {
  const isManual = item.entryType === 'MANUAL';
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          isManual && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_e, g) => {
          if (g.dx < 0) translateX.setValue(g.dx);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dx <= -SWIPE_DELETE_THRESHOLD) {
            onDelete(item.id);
          }
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [isManual, item.id, onDelete, translateX],
  );

  return (
    <View style={styles.rowWrap}>
    {isManual ? (
      <View style={styles.deleteBackdrop} importantForAccessibility="no-hide-descendants">
        <Text style={styles.deleteText}>🗑 Delete</Text>
      </View>
    ) : null}
    <Animated.View
      testID={`expense-row-${item.id}`}
      style={[styles.row, { transform: [{ translateX }] }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${item.vendorName}, ${item.category}, ${isManual ? 'manual' : 'scanned'} entry, ${canView ? money(item.amount) : 'amount hidden'}, tax ${canView ? money(item.taxAmount) : 'hidden'}`}
      accessibilityActions={isManual ? [{ name: 'delete', label: 'Delete entry' }] : undefined}
      onAccessibilityAction={(e) => {
        if (isManual && e.nativeEvent.actionName === 'delete') onDelete(item.id);
      }}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={styles.rowMain}
        disabled={!isManual}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isManual }}
        onPress={() => onEdit(item)}
        accessibilityLabel={isManual ? `Edit ${item.vendorName}` : `${item.vendorName} scanned entry`}
      >
        <Text style={styles.rowTitle}>
          {isManual ? '✎' : '🧾'} {item.vendorName}
        </Text>
        <Text style={styles.rowMeta}>
          {item.invoiceNumber} · {item.category} · {isManual ? 'Manual' : 'Scanned'}
        </Text>
      </Pressable>
      <View style={styles.rowAmountCol}>
        <Text style={styles.rowAmount}>{canView ? money(item.amount) : '••••'}</Text>
        <Text style={styles.rowTax}>Tax {canView ? money(item.taxAmount) : '••••'}</Text>
      </View>
    </Animated.View>
    </View>
  );
}

export function FinancialLedgerScreen() {
  const navigation = useNavigation<Navigation>();
  const summary = useLedgerStore((s) => s.summary);
  const expenses = useLedgerStore((s) => s.expenses);
  const status = useLedgerStore((s) => s.status);
  const loadSummary = useLedgerStore((s) => s.loadSummary);
  const createManualExpense = useLedgerStore((s) => s.createManualExpense);
  const editExpense = useLedgerStore((s) => s.editExpense);
  const deleteExpense = useLedgerStore((s) => s.deleteExpense);
  const canAccess = useSessionStore((s) => s.canAccess);

  const canViewAmounts = canAccess('financial', 'amount');
  const canViewBalance = canAccess('financial', 'balance');
  const canWrite = canAccess('financial', 'amount', { write: true });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});

  useEffect(() => {
    void loadSummary(summary.periodMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taxTotal = useMemo(
    () => Math.round(expenses.reduce((acc, e) => acc + e.taxAmount, 0) * 100) / 100,
    [expenses],
  );

  const screenState: FinancialLedgerScreenState =
    status === 'idle' ? 'verified' : status;

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: ExpenseEntry) => {
    setEditingId(item.id);
    setForm({
      vendorName: item.vendorName,
      invoiceNumber: item.invoiceNumber,
      amount: String(item.amount),
      taxAmount: String(item.taxAmount),
      category: item.category,
    });
    setErrors({});
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
  }, []);

  const submit = useCallback(() => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const values = {
      vendorName: form.vendorName.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      amount: Number(form.amount),
      taxAmount: Number(form.taxAmount === '' ? '0' : form.taxAmount),
      category: form.category.trim(),
    };
    if (editingId) editExpense(editingId, values);
    else createManualExpense(values);
    closeForm();
  }, [form, editingId, editExpense, createManualExpense, closeForm]);

  const setField = (field: keyof ExpenseFormValues) => (text: string) =>
    setForm((prev) => ({ ...prev, [field]: text }));

  const renderField = (
    field: keyof ExpenseFormValues,
    label: string,
    keyboardType: 'default' | 'numeric' = 'default',
  ) => (
    <View style={styles.field} key={field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={setField(field)}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        testID={`expense-form-${field}`}
      />
      {errors[field] ? <Text style={styles.error}>{errors[field]}</Text> : null}
    </View>
  );

  const header = (
    <View>
      {screenState === 'loading' || screenState === 'saving' || screenState === 'scanning_ocr' ? (
        <View style={styles.statusBar} testID="ledger-status-busy">
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.statusText}>
            {screenState === 'loading' && 'Loading…'}
            {screenState === 'saving' && 'Saving…'}
            {screenState === 'scanning_ocr' && 'Scanning receipt…'}
          </Text>
        </View>
      ) : null}
      {screenState === 'error' ? (
        <View style={styles.statusBar} testID="ledger-status-error">
          <Text style={styles.error} accessibilityRole="alert">⚠ Something went wrong.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={() => void loadSummary(summary.periodMonth)}
          >
            <Text style={styles.link}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.summary} testID="ledger-summary">
        <Text style={styles.heading} accessibilityRole="header">
          Financial summary · {summary.periodMonth}
        </Text>
        <View style={styles.summaryGrid}>
          <View
            style={[styles.card, styles.card_confirmed]}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Invoiced, ${canViewAmounts ? money(summary.totalInvoicedAmount) : 'hidden'}`}
          >
            <Text style={styles.cardLabel}>Invoiced</Text>
            <Text style={styles.cardValue} testID="summary-invoiced">
              {canViewAmounts ? money(summary.totalInvoicedAmount) : '••••'}
            </Text>
          </View>
          <View
            style={[styles.card, styles.card_priority]}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Expenses, ${canViewAmounts ? money(summary.totalExpensesAmount) : 'hidden'}`}
          >
            <Text style={styles.cardLabel}>Expenses</Text>
            <Text style={styles.cardValue} testID="summary-expenses">
              {canViewAmounts ? money(summary.totalExpensesAmount) : '••••'}
            </Text>
          </View>
          <View
            style={[styles.card, styles.card_accent]}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Net balance, ${canViewBalance ? money(summary.netBalance) : 'hidden'}`}
          >
            <Text style={styles.cardLabel}>Net balance</Text>
            <Text style={styles.cardValue} testID="summary-net">
              {canViewBalance ? money(summary.netBalance) : '••••'}
            </Text>
          </View>
          <View
            style={[styles.card, styles.card_urgent]}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Tax, ${canViewAmounts ? money(taxTotal) : 'hidden'}`}
          >
            <Text style={styles.cardLabel}>Tax</Text>
            <Text style={styles.cardValue} testID="summary-tax">
              {canViewAmounts ? money(taxTotal) : '••••'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.heading} accessibilityRole="header">Expenses</Text>
        {canWrite ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Add manual expense" onPress={openCreate} style={styles.button}>
            <Text style={styles.buttonText}>Add manual</Text>
          </Pressable>
        ) : null}
      </View>

      {formOpen && canWrite ? (
        <View style={styles.form} testID="expense-form">
          <Text style={styles.heading}>{editingId ? 'Edit expense' : 'New expense'}</Text>
          {renderField('vendorName', 'Vendor')}
          {renderField('invoiceNumber', 'Invoice number')}
          {renderField('amount', 'Amount', 'numeric')}
          {renderField('taxAmount', 'Tax amount', 'numeric')}
          {renderField('category', 'Category')}
          <View style={styles.formActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={closeForm} style={styles.buttonAlt}>
              <Text style={styles.link}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Save expense" onPress={submit} style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListFooterComponent={
          <View
            style={styles.totals}
            accessible
            accessibilityLabel={`Totals. Expenses ${canViewAmounts ? money(summary.totalExpensesAmount) : 'hidden'}. Tax ${canViewAmounts ? money(taxTotal) : 'hidden'}`}
            testID="ledger-totals"
          >
            <Text style={styles.totalsText}>Total {canViewAmounts ? money(summary.totalExpensesAmount) : '••••'}</Text>
            <Text style={styles.totalsText}>Tax {canViewAmounts ? money(taxTotal) : '••••'}</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No expenses registered. Tap the scan button to add one.</Text>}
        renderItem={({ item }) => (
          <ExpenseRow
            item={item}
            canView={canViewAmounts}
            onEdit={openEdit}
            onDelete={deleteExpense}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      {canWrite ? (
        <Pressable
          accessibilityLabel="Scan receipt"
          accessibilityHint="Opens the camera to scan a receipt"
          accessibilityRole="button"
          style={styles.fab}
          onPress={() => navigation.navigate('ReceiptScanner')}
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 96 },
  heading: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  summary: { marginBottom: 16, gap: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  card_confirmed: { borderLeftWidth: 4, borderLeftColor: theme.colors.status.confirmed },
  card_priority: { borderLeftWidth: 4, borderLeftColor: theme.colors.status.priority },
  card_accent: { borderLeftWidth: 4, borderLeftColor: theme.colors.accent },
  card_urgent: { borderLeftWidth: 4, borderLeftColor: theme.colors.status.urgent },
  cardLabel: { fontSize: 12, color: theme.colors.textMuted },
  cardValue: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  rowWrap: { marginBottom: 12, justifyContent: 'center' },
  deleteBackdrop: {
    ...StyleSheet.absoluteFill,
    borderRadius: 8,
    backgroundColor: theme.colors.status.urgent,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 16,
  },
  deleteText: { color: theme.colors.onAccent, fontWeight: '700' },
  rowAmountCol: { alignItems: 'flex-end' },
  rowTax: { fontSize: 12, color: theme.colors.textMuted },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderTopWidth: 2,
    borderTopColor: theme.colors.accent,
  },
  totalsText: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  rowMeta: { fontSize: 12, color: theme.colors.textMuted },
  rowAmount: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 24 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusText: { color: theme.colors.textSecondary },
  error: { color: theme.colors.error, fontSize: 12 },
  link: { color: theme.colors.accentStrong, fontWeight: '600' },
  form: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceAlt,
  },
  field: { marginTop: 8 },
  label: { fontSize: 12, color: theme.colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    padding: 8,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
  },
  buttonAlt: { paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  buttonText: { color: theme.colors.onAccent, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  fabText: { color: theme.colors.onAccent, fontSize: 28 },
});
