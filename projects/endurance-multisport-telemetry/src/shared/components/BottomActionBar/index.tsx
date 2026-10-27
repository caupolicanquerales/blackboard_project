import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/tokens';
import type { BottomActionBarProps } from './BottomActionBar.types';

export function BottomActionBar({
  primaryLabel,
  onPrimary,
  secondaryActions,
  primaryDisabled = false,
}: BottomActionBarProps) {
  return (
    <View style={styles.container} testID="bottom-action-bar" accessibilityRole="toolbar">
      {secondaryActions.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: !!action.disabled }}
          disabled={action.disabled}
          onPress={action.onPress}
          style={[styles.secondary, action.disabled && styles.disabled]}
        >
          <Text style={styles.secondaryText}>{action.label}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: primaryDisabled }}
        disabled={primaryDisabled}
        onPress={onPrimary}
        style={[styles.primary, primaryDisabled && styles.disabled]}
      >
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const { colors, spacing, radii, minTouchTarget, typography } = theme;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primary: {
    flex: 1,
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  primaryText: {
    ...typography.headingStyle,
    color: colors.onAccent,
    fontSize: typography.fontSizes.body,
  },
  secondary: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  secondaryText: {
    color: colors.text,
    fontSize: typography.fontSizes.body,
  },
  disabled: {
    opacity: 0.5,
  },
});
