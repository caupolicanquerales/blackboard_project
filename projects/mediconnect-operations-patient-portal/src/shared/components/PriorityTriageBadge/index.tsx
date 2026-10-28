import { StyleSheet, Text, View } from 'react-native';
import { severityColor, theme } from '../../theme/theme';
import type { SeverityLevel } from '../../models/common';
import type { PriorityTriageBadgeProps } from './PriorityTriageBadge.types';

type Tone = { label: string; icon: string; background: string; foreground: string; border: string };

const TONES: Record<SeverityLevel, Tone> = {
  URGENT: { ...pick('URGENT'), label: 'Urgent' },
  HIGH: { ...pick('HIGH'), label: 'High' },
  MEDIUM: { ...pick('MEDIUM'), label: 'Medium' },
  ROUTINE: { ...pick('ROUTINE'), label: 'Routine' },
};

function pick(level: SeverityLevel) {
  const { background, foreground, border, icon } = severityColor(level);
  return { background, foreground, border, icon };
}

const MAX_SCORE = 10;

export function PriorityTriageBadge({ severity, score }: PriorityTriageBadgeProps) {
  const tone = TONES[severity];
  const safeScore = Number.isFinite(score) ? Math.min(MAX_SCORE, Math.max(0, score)) : 0;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Priority ${tone.label}, score ${safeScore} out of ${MAX_SCORE}`}
      accessibilityValue={{ min: 0, max: MAX_SCORE, now: safeScore, text: `${tone.label}, ${safeScore} out of ${MAX_SCORE}` }}
      style={[styles.badge, { backgroundColor: tone.background, borderColor: tone.border }]}
    >
      <Text accessible={false} importantForAccessibility="no" style={styles.icon}>{tone.icon}</Text>
      <Text style={[styles.label, { color: tone.foreground }]}>{tone.label}</Text>
      <Text style={[styles.score, { color: tone.foreground }]}>{safeScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    paddingHorizontal: 10,
    paddingVertical: theme.spacing.xs,
  },
  icon: { fontSize: 12 },
  label: { ...theme.typography.caption, fontWeight: '700' },
  score: { ...theme.typography.caption, fontWeight: '700' },
});
