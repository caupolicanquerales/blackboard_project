import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PharmacyStatus } from '../../../../shared/models/patient';
import type { PrescriptionPharmacyStatusCardProps } from './PrescriptionPharmacyStatusCard.types';

const STATUS_LABELS: Record<PharmacyStatus, string> = {
  PENDING: 'Issued',
  SENT_TO_PHARMACY: 'Dispatched to pharmacy',
  READY_FOR_PICKUP: 'Ready for pickup',
};

export function PrescriptionPharmacyStatusCard({
  prescription,
  onPress,
}: PrescriptionPharmacyStatusCardProps) {
  const statusLabel = STATUS_LABELS[prescription.pharmacyStatus];
  const tone = STATUS_STYLE[prescription.pharmacyStatus];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${prescription.medicationName}, ${statusLabel}`}
      onPress={() => onPress(prescription)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.name}>{prescription.medicationName}</Text>
      <Text style={styles.detail}>{prescription.dosage}</Text>
      <Text style={styles.detail}>{prescription.issuingDoctor}</Text>
      <View style={[styles.chip, { backgroundColor: tone.bg }]}>
        <Text accessible={false} style={[styles.chipText, { color: tone.fg }]}>
          {tone.icon} {statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const COLORS = {
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#475569',
  accent: '#0284C7',
  confirmed: '#10B981',
};

const STATUS_STYLE: Record<PharmacyStatus, { bg: string; fg: string; icon: string }> = {
  PENDING: { bg: '#E0F2FE', fg: '#075985', icon: '📝' },
  SENT_TO_PHARMACY: { bg: '#FEF3C7', fg: '#92400E', icon: '🚚' },
  READY_FOR_PICKUP: { bg: COLORS.confirmed, fg: '#022C22', icon: '✅' },
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 6,
    minHeight: 44,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    backgroundColor: COLORS.surface,
  },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  detail: { fontSize: 14, color: COLORS.muted },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
});
