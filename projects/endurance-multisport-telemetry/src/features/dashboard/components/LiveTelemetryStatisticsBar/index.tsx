import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../shared/theme/tokens';
import type { LiveTelemetryStatisticsBarProps } from './LiveTelemetryStatisticsBar.types';

const toPercent = (value: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

export function LiveTelemetryStatisticsBar({
  metric,
  status,
  maxHeartRate,
  maxPower,
}: LiveTelemetryStatisticsBarProps) {
  if (status === 'loading') {
    return <Text style={styles.message} accessibilityRole="text" accessibilityLiveRegion="polite">Loading telemetry...</Text>;
  }
  if (status === 'error') {
    return <Text style={[styles.message, styles.error]} accessibilityRole="alert">Unable to load telemetry</Text>;
  }
  if (status === 'empty' || !metric) {
    return <Text style={styles.message}>No telemetry available</Text>;
  }

  const hrPercent = toPercent(metric.heartRate, maxHeartRate);
  const powerPercent = toPercent(metric.powerOutput, maxPower);

  return (
    <View style={styles.container} testID="live-telemetry-bar">
      <View style={styles.row}>
        <Text style={styles.label}>{`Heart rate ${metric.heartRate} bpm`}</Text>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityLabel="Heart rate"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(hrPercent), text: `${metric.heartRate} bpm` }}
        >
          <View testID="hr-meter" style={[styles.hrFill, { width: `${hrPercent}%` }]} />
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{`Power ${metric.powerOutput} W`}</Text>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityLabel="Power"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(powerPercent), text: `${metric.powerOutput} W` }}
        >
          <View testID="power-meter" style={[styles.powerFill, { width: `${powerPercent}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: theme.spacing.xs, alignItems: 'stretch' },
  row: { gap: theme.spacing.xxs },
  label: { fontSize: theme.typography.fontSizes.caption, color: theme.colors.text },
  track: {
    height: theme.spacing.md,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceElevated,
  },
  hrFill: { height: '100%', backgroundColor: theme.colors.accent },
  powerFill: { height: '100%', backgroundColor: theme.colors.warning },
  message: { fontSize: theme.typography.fontSizes.caption, color: theme.colors.muted },
  error: { color: theme.colors.error },
});
