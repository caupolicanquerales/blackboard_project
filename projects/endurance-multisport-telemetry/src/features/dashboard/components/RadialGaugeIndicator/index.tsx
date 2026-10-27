import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../../../shared/theme/tokens';
import type { RadialGaugeIndicatorProps } from './RadialGaugeIndicator.types';

const SIZE = 128;
const STROKE = 12;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE / 2;
const GAP = 16;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

type RingProps = {
  pct: number;
  color: string;
  label: string;
  caption: string;
  testID: string;
};

function Ring({ pct, color, label, caption, testID }: RingProps) {
  const circumference = 2 * Math.PI * RADIUS;
  const rounded = Math.round(pct);
  return (
    <View style={styles.ringItem}>
      <View
        style={styles.ringBox}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: rounded, text: `${rounded}%` }}
      >
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={theme.colors.surfaceElevated}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            testID={testID}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - pct / 100)}
            rotation={-90}
            origin={`${CENTER}, ${CENTER}`}
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.metric}>{`${rounded}%`}</Text>
        </View>
      </View>
      <Text style={styles.label}>{caption}</Text>
    </View>
  );
}

export function RadialGaugeIndicator({ targetLoadPct, intervalPct, status }: RadialGaugeIndicatorProps) {
  if (status === 'loading') {
    return (
      <View style={styles.messageBox} accessibilityRole="progressbar" accessibilityLabel="Loading gauge">
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.message}>Loading gauge...</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.messageBox} accessibilityRole="alert">
        <Text style={[styles.message, styles.error]}>Unable to load gauge</Text>
      </View>
    );
  }
  if (status === 'empty') {
    return (
      <View style={styles.messageBox}>
        <Text style={styles.message}>No gauge data</Text>
      </View>
    );
  }

  const target = clamp(targetLoadPct);
  const interval = clamp(intervalPct);

  return (
    <View style={styles.container} testID="radial-gauge">
      <Ring
        pct={target}
        color={theme.colors.accent}
        label="Target load completion"
        caption={`Target ${Math.round(target)}%`}
        testID="gauge-ring-target"
      />
      <Ring
        pct={interval}
        color={theme.colors.warning}
        label="Interval progress"
        caption={`Interval ${Math.round(interval)}%`}
        testID="gauge-ring-interval"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: GAP,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
  },
  ringItem: { alignItems: 'center', gap: theme.spacing.sm },
  ringBox: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  metric: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.heading,
    fontWeight: theme.typography.headingStyle.fontWeight,
    fontStyle: theme.typography.headingStyle.fontStyle,
  },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.fontSizes.caption,
    fontWeight: theme.typography.headingStyle.fontWeight,
    fontStyle: theme.typography.headingStyle.fontStyle,
    textTransform: theme.typography.headingStyle.textTransform,
    letterSpacing: theme.typography.headingStyle.letterSpacing,
  },
  messageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
  },
  message: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body, textAlign: 'center' },
  error: { color: theme.colors.error },
});
