import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { PharmacyStatus } from '../../../../shared/models/patient';
import { usePatientPortalStore } from '../../data/patient-portal.store';
import type {
  PrescriptionDetailRouteProp,
  PrescriptionDetailScreenState,
} from './PrescriptionDetailScreen.types';

const STATUS_LABELS: Record<PharmacyStatus, string> = {
  PENDING: 'Issued',
  SENT_TO_PHARMACY: 'Dispatched to pharmacy',
  READY_FOR_PICKUP: 'Ready for pickup',
};

export function PrescriptionDetailScreen() {
  const route = useRoute<PrescriptionDetailRouteProp>();
  const { prescriptionId } = route.params;
  const prescriptions = usePatientPortalStore((s) => s.prescriptions);
  const storeStatus = usePatientPortalStore((s) => s.status);
  const load = usePatientPortalStore((s) => s.load);

  useEffect(() => {
    if (storeStatus === 'loading' && prescriptions.length === 0) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prescription = prescriptions.find((p) => p.id === prescriptionId);

  let state: PrescriptionDetailScreenState;
  if (storeStatus === 'loading') state = 'loading';
  else if (storeStatus === 'error') state = 'error';
  else if (!prescription) state = 'empty';
  else state = 'success';

  return (
    <SafeAreaView style={styles.root} testID="prescription-detail-screen">
      {state === 'loading' && (
        <View style={styles.center} testID="state-loading">
          <ActivityIndicator accessibilityLabel="Loading prescription" />
        </View>
      )}
      {state === 'error' && (
        <View style={styles.center} testID="state-error">
          <Text style={styles.message}>Could not load the prescription.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={() => void load()}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
      {state === 'empty' && (
        <View style={styles.center} testID="state-empty">
          <Text style={styles.message}>Prescription not found.</Text>
        </View>
      )}
      {state === 'success' && prescription && (
        <ScrollView contentContainerStyle={styles.content} testID="state-success">
          <Text accessibilityRole="header" style={styles.title}>
            {prescription.medicationName}
          </Text>
          <Field label="Dosage" value={prescription.dosage} />
          <Field label="Instructions" value={prescription.instructions} />
          <Field label="Issuing doctor" value={prescription.issuingDoctor} />
          <Field label="Issued at" value={new Date(prescription.issuedAt).toLocaleDateString()} />
          <Field
            label="Pharmacy status"
            value={STATUS_LABELS[prescription.pharmacyStatus]}
            testID="pharmacy-status"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Field({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  field: { gap: 2 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569' },
  value: { fontSize: 16, color: '#0F172A' },
  message: { fontSize: 16, color: '#475569' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  retryText: { fontSize: 16, fontWeight: '600', color: '#0284C7' },
});
