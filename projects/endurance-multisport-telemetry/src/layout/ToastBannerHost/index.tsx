import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../shared/theme/tokens';
import type { ToastBannerHostProps } from './ToastBannerHost.types';

export function ToastBannerHost({ notifications, onDismiss }: ToastBannerHostProps) {
  const head = notifications[0];
  if (!head) {
    return null;
  }

  return (
    <View
      testID="toast-banner"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.container}
    >
      <Text testID="toast-message" style={styles.message}>
        {head.message}
      </Text>
      <Pressable
        testID="toast-dismiss"
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={4}
        onPress={() => onDismiss(head.id)}
        style={styles.dismiss}
      >
        <Text style={styles.dismissText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderLeftWidth: theme.spacing.xxs,
    borderLeftColor: theme.colors.accent,
    borderRadius: theme.radii.md,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.fontSizes.body,
    color: theme.colors.text,
  },
  dismiss: {
    minWidth: theme.minTouchTarget,
    minHeight: theme.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: theme.typography.fontSizes.subtitle,
    color: theme.colors.text,
  },
});
