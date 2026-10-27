import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IntervalCardItem } from '../../models/interval-card-item';
import { theme } from '../../theme/tokens';
import type { IntervalExerciseCardsProps } from './IntervalExerciseCards.types';

const { colors, spacing, radii, typography, minTouchTarget } = theme;

export function IntervalExerciseCards({ items, status, onComplete }: IntervalExerciseCardsProps) {
  if (status === 'loading') {
    return (
      <View style={styles.state} accessibilityRole="progressbar" accessibilityLabel="Loading workout steps">
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.stateText} testID="interval-cards-loading">Loading...</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.state} accessibilityRole="alert">
        <Text style={[styles.stateText, { color: colors.error }]} testID="interval-cards-error">
          Something went wrong
        </Text>
      </View>
    );
  }
  if (status === 'empty' || items.length === 0) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText} testID="interval-cards-empty">No steps</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: IntervalCardItem }) => (
    <View
      style={[styles.card, item.isDone && styles.cardDone]}
      accessible
      accessibilityLabel={`${item.stepNumber}, ${item.title}. ${item.description}. Target zone ${item.targetZone}. ${item.isDone ? 'Completed' : 'Not completed'}`}
      testID={`interval-card-${item.id}`}
    >
      <Text style={styles.step}>{item.stepNumber}</Text>
      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.zone}>{item.targetZone}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Complete ${item.title}`}
        accessibilityState={{ disabled: item.isDone, checked: item.isDone }}
        disabled={item.isDone}
        onPress={() => onComplete(item.id)}
        style={({ pressed }) => [styles.check, item.isDone && styles.checkDone, pressed && styles.pressed]}
        testID={`interval-complete-${item.id}`}
      >
        <Text style={[styles.checkText, item.isDone && { color: colors.success }]}>
          {item.isDone ? '✓' : '○'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      testID="interval-exercise-cards"
    />
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'column', gap: spacing.md, alignItems: 'stretch' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDone: { borderColor: colors.success },
  step: {
    color: colors.accent,
    fontSize: typography.fontSizes.subtitle,
    ...typography.headingStyle,
  },
  body: { flex: 1, gap: spacing.xxs },
  title: {
    color: colors.text,
    fontSize: typography.fontSizes.body,
    ...typography.headingStyle,
  },
  description: { color: colors.muted, fontSize: typography.fontSizes.body },
  zone: { color: colors.warning, fontSize: typography.fontSizes.caption, fontWeight: '700' },
  check: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
  },
  checkDone: { opacity: 0.8 },
  pressed: { opacity: 0.6 },
  checkText: { color: colors.text, fontSize: typography.fontSizes.heading },
  state: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  stateText: { color: colors.muted, fontSize: typography.fontSizes.body },
});
