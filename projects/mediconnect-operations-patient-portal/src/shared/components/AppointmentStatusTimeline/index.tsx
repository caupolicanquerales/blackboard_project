import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import type { AppointmentStatus } from '../../models/appointment';
import type { AppointmentStatusTimelineProps, TimelineStepState } from './AppointmentStatusTimeline.types';

const STEPS: { status: AppointmentStatus; label: string }[] = [
  { status: 'PENDING_TRIAGE', label: 'Pending triage' },
  { status: 'SCHEDULED', label: 'Scheduled' },
  { status: 'WHATSAPP_SENT', label: 'WhatsApp sent' },
  { status: 'CALL_REQUIRED', label: 'Call required' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'IN_CONSULTATION', label: 'In consultation' },
  { status: 'COMPLETED', label: 'Completed' },
];

const STATE_TEXT: Record<TimelineStepState, string> = {
  completed: 'completed',
  current: 'current',
  upcoming: 'upcoming',
};

export function AppointmentStatusTimeline({ status }: AppointmentStatusTimelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  const stepNumber = Math.max(currentIndex, 0) + 1;
  const currentLabel = STEPS[Math.max(currentIndex, 0)].label;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Appointment status timeline"
      accessibilityValue={{
        min: 1,
        max: STEPS.length,
        now: stepNumber,
        text: `Step ${stepNumber} of ${STEPS.length}: ${currentLabel}`,
      }}
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      {STEPS.map((step, index) => {
        const state: TimelineStepState =
          index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming';
        const isLast = index === STEPS.length - 1;
        const filled = state !== 'upcoming';
        return (
          <View
            key={step.status}
            accessible
            accessibilityLabel={`${step.label}, ${STATE_TEXT[state]}`}
            accessibilityState={{ selected: state === 'current' }}
            style={styles.step}
          >
            <View
              testID={`timeline-node-${step.status}`}
              style={[styles.node, filled && styles.nodeFilled, state === 'current' && styles.nodeCurrent]}
            >
              {state === 'completed' ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={[styles.label, state === 'current' && styles.labelCurrent, state === 'upcoming' && styles.labelUpcoming]}>
              {step.label}
            </Text>
            {!isLast ? (
              <View
                testID={`timeline-connector-${step.status}`}
                style={[styles.connector, state === 'completed' && styles.connectorDone]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const NODE_SIZE = 20;

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeFilled: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  nodeCurrent: { borderColor: theme.colors.accentStrong, backgroundColor: theme.colors.accentStrong },
  check: { color: theme.colors.onAccent, fontSize: 12, fontWeight: '700' },
  connector: { height: 2, width: 16, backgroundColor: theme.colors.border },
  connectorDone: { backgroundColor: theme.colors.accent },
  label: { ...theme.typography.body, color: theme.colors.textSecondary, },
  labelCurrent: { color: theme.colors.textPrimary, fontWeight: '700' },
  labelUpcoming: { color: theme.colors.textMuted },
});
