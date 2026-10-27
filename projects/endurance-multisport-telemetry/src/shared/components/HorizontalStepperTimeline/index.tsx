import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/tokens';
import type { HorizontalStepperTimelineProps } from './HorizontalStepperTimeline.types';

export function HorizontalStepperTimeline({ steps, onPressStep }: HorizontalStepperTimelineProps) {
  return (
    <View style={styles.container} testID="horizontal-stepper-timeline" accessibilityRole="list">
      {steps.map((step, index) => {
        const stepNumber = `STEP ${String(index + 1).padStart(2, '0')}`;
        const isActive = step.state === 'active';
        const isDone = step.state === 'done';
        const statusText = isDone ? 'completed' : isActive ? 'in progress' : 'pending';
        return (
          <Pressable
            key={step.id}
            accessibilityRole="button"
            accessibilityLabel={`${stepNumber}, ${step.label}, ${statusText}`}
            accessibilityState={{ selected: isActive, checked: isDone }}
            testID={`timeline-step-${step.id}`}
            onPress={() => onPressStep(step.id)}
            style={({ pressed }) => [
              styles.step,
              isActive && styles.stepActive,
              isDone && styles.stepDone,
              pressed && styles.stepPressed,
            ]}
          >
            <Text style={[styles.index, isActive && styles.indexActive]}>{stepNumber}</Text>
            <Text style={styles.label} numberOfLines={1}>
              {step.label}
            </Text>
            <Text style={[styles.chevron, isActive && styles.chevronActive]}>{isDone ? '✓' : '›'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  step: {
    flex: 1,
    minHeight: theme.minTouchTarget,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.7,
  },
  stepActive: {
    opacity: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accent,
  },
  stepDone: {
    opacity: 0.9,
    borderColor: theme.colors.success,
  },
  stepPressed: {
    opacity: 0.6,
  },
  index: {
    ...theme.typography.headingStyle,
    fontSize: 10,
    color: theme.colors.muted,
  },
  indexActive: {
    color: theme.colors.accent,
  },
  label: {
    fontSize: theme.typography.fontSizes.caption,
    color: theme.colors.text,
  },
  chevron: {
    position: 'absolute',
    right: theme.spacing.xxs,
    top: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: theme.typography.fontSizes.body,
  },
  chevronActive: {
    color: theme.colors.accent,
  },
});
