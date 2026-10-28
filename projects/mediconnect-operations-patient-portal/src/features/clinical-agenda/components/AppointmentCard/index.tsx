import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { theme } from '../../../../shared/theme/theme';
import type { AppointmentCardProps } from './AppointmentCard.types';

const TYPE_LABEL = {
  CONSULTATION: 'Consultation',
  SURGICAL_PROCEDURE: 'Surgical procedure',
} as const;

function formatStatus(status: string): string {
  const text = status.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function AppointmentCard({
  appointment,
  onSendWhatsApp,
  onRequireCall,
  onReschedule,
  onPress,
}: AppointmentCardProps) {
  const renderActions = () => (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send WhatsApp"
        onPress={() => onSendWhatsApp(appointment)}
        style={[styles.action, styles.whatsapp]}
      >
        <Text style={styles.actionText}>Send WhatsApp</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Require Call"
        onPress={() => onRequireCall(appointment)}
        style={[styles.action, styles.call]}
      >
        <Text style={styles.actionText}>Require Call</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reschedule"
        onPress={() => onReschedule(appointment)}
        style={[styles.action, styles.reschedule]}
      >
        <Text style={styles.actionText}>Reschedule</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderActions} overshootRight={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Appointment for ${appointment.patientName}`}
        onPress={() => onPress?.(appointment)}
        style={styles.card}
      >
        <Text style={styles.name}>{appointment.patientName}</Text>
        <Text style={styles.detail}>{TYPE_LABEL[appointment.appointmentType]}</Text>
        <View style={styles.row}>
          <Text style={styles.detail}>{formatTime(appointment.scheduledTime)}</Text>
          <Text style={styles.detail}>{appointment.durationMinutes} min</Text>
        </View>
        <Text style={styles.status}>{formatStatus(appointment.status)}</Text>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xl,
    minHeight: theme.minTouchTarget,
    gap: theme.spacing.xs,
  },
  name: { ...theme.typography.h3, color: theme.colors.textPrimary },
  detail: { ...theme.typography.body, color: theme.colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  status: { ...theme.typography.caption, color: theme.colors.accentStrong },
  actions: { flexDirection: 'row' },
  action: {
    minWidth: 96,
    minHeight: theme.minTouchTarget,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...theme.typography.caption,
    color: theme.colors.onAccent,
    textAlign: 'center',
  },
  whatsapp: { backgroundColor: theme.colors.statusText.confirmed },
  call: { backgroundColor: theme.colors.accentStrong },
  reschedule: { backgroundColor: theme.colors.textSecondary },
});
