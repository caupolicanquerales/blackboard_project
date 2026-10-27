import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../shared/theme/tokens';
import type { ComparisonSplitBarsProps } from './ComparisonSplitBars.types';

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function ComparisonSplitBars({ ratios, status }: ComparisonSplitBarsProps) {
  if (status === 'loading') {
    return <Text style={styles.message} accessibilityRole="text" accessibilityLiveRegion="polite">Loading ratios...</Text>;
  }
  if (status === 'error') {
    return <Text style={[styles.message, styles.error]} accessibilityRole="alert">Unable to load ratios</Text>;
  }
  if (status === 'empty' || ratios.length === 0) {
    return <Text style={styles.message} accessibilityRole="text">No ratios available</Text>;
  }

  return (
    <View style={styles.container}>
      {ratios.slice(0, 2).map((ratio) => {
        const primary = clamp(ratio.primaryPercentage);
        const secondary = clamp(ratio.secondaryPercentage);
        return (
          <View
            key={ratio.id}
            style={styles.row}
            testID={`split-bar-${ratio.id}`}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${ratio.categoryLabel}: ${primary} percent primary, ${secondary} percent secondary`}
            accessibilityValue={{ min: 0, max: 100, now: primary }}
          >
            <Text style={styles.label}>{ratio.categoryLabel}</Text>
            <View style={styles.bar} importantForAccessibility="no-hide-descendants">
              <View
                testID={`split-primary-${ratio.id}`}
                style={[styles.primary, { flex: primary }]}
              />
              <View
                testID={`split-secondary-${ratio.id}`}
                style={[styles.secondary, { flex: secondary }]}
              />
            </View>
            <Text style={styles.values} importantForAccessibility="no">{`${primary}/${secondary}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', alignItems: 'stretch', gap: theme.spacing.sm },
  row: { gap: theme.spacing.xxs, alignItems: 'stretch' },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.caption,
    ...theme.typography.headingStyle,
  },
  bar: {
    flexDirection: 'row',
    height: theme.spacing.md,
    borderRadius: theme.radii.pill,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceElevated,
  },
  primary: { backgroundColor: theme.colors.accent },
  secondary: { backgroundColor: theme.colors.muted },
  values: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.caption },
  message: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body },
  error: { color: theme.colors.error },
});
