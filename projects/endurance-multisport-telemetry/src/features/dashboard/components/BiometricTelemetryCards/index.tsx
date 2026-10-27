import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../../../shared/theme/tokens';
import type {
  BiometricMetricKind,
  BiometricTelemetryCardsProps,
} from './BiometricTelemetryCards.types';

type CardConfig = {
  kind: BiometricMetricKind;
  label: string;
  unit: string;
  icon: 'heart-pulse' | 'lightning-bolt' | 'bike-fast';
};

const CARDS: CardConfig[] = [
  { kind: 'heart', label: 'Heart rate', unit: 'bpm', icon: 'heart-pulse' },
  { kind: 'power', label: 'Power', unit: 'W', icon: 'lightning-bolt' },
  { kind: 'cadence', label: 'Cadence', unit: 'rpm', icon: 'bike-fast' },
];

export function BiometricTelemetryCards({
  metric,
  status,
  onPressMetric,
}: BiometricTelemetryCardsProps) {
  if (status === 'loading') {
    return (
      <View style={styles.messageBox} accessibilityRole="progressbar" accessibilityLabel="Loading telemetry">
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.message}>Loading telemetry...</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.messageBox} accessibilityRole="alert">
        <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.colors.error} />
        <Text style={[styles.message, { color: theme.colors.error }]}>Unable to load telemetry</Text>
      </View>
    );
  }
  if (status === 'empty' || !metric) {
    return (
      <View style={styles.messageBox}>
        <MaterialCommunityIcons name="database-off-outline" size={24} color={theme.colors.muted} />
        <Text style={styles.message}>No telemetry available</Text>
      </View>
    );
  }

  const values: Record<BiometricMetricKind, number> = {
    heart: metric.heartRate,
    power: metric.powerOutput,
    cadence: metric.cadence,
  };

  return (
    <View style={styles.row} accessibilityRole="summary">
      {CARDS.map((card) => (
        <Pressable
          key={card.kind}
          accessibilityRole="button"
          accessibilityLabel={`${card.label}, ${values[card.kind]} ${card.unit}`}
          accessibilityHint="Opens detail"
          testID={`metric-card-${card.kind}`}
          onPress={() => onPressMetric(card.kind)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <MaterialCommunityIcons name={card.icon} size={28} color={theme.colors.accent} />
          <Text style={styles.value}>{values[card.kind]}</Text>
          <Text style={styles.unit}>{card.unit}</Text>
          <Text style={styles.label}>{card.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  card: {
    flexGrow: 1,
    flexBasis: 96,
    minHeight: theme.minTouchTarget,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardPressed: { backgroundColor: theme.colors.surfaceElevated },
  value: {
    fontSize: theme.typography.fontSizes.heading,
    fontWeight: theme.typography.headingStyle.fontWeight,
    fontStyle: theme.typography.headingStyle.fontStyle,
    color: theme.colors.text,
  },
  unit: {
    fontSize: theme.typography.fontSizes.caption,
    color: theme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  label: {
    fontSize: theme.typography.fontSizes.caption,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.headingStyle.letterSpacing,
  },
  messageBox: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  message: { textAlign: 'center', color: theme.colors.muted },
});
