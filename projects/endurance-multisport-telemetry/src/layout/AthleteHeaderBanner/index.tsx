import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../shared/theme/tokens';
import type { AthleteHeaderBannerProps } from './AthleteHeaderBanner.types';

export function AthleteHeaderBanner({
  profile,
  status,
  onPressSync,
  onPressAvatar,
}: AthleteHeaderBannerProps) {
  const sportLabel =
    status === 'loading' ? 'Loading…' : status === 'error' ? 'Unavailable' : profile?.activeSport ?? '—';

  return (
    <View testID="athlete-header-banner" accessibilityRole="header" accessibilityLabel="Endurance Telemetry" style={styles.container}>
      <Pressable
        testID="athlete-avatar"
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={4}
        onPress={onPressAvatar}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      >
        {profile?.avatarUri ? (
          <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} accessibilityIgnoresInvertColors />
        ) : null}
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>ENDURANCE TELEMETRY</Text>
        <Text testID="active-sport" style={[styles.sport, status === 'error' && styles.sportError]}>
          {sportLabel}
        </Text>
      </View>
      <Pressable
        testID="sync-button"
        accessibilityRole="button"
        accessibilityLabel="Sync"
        accessibilityState={{ disabled: status === 'loading', busy: status === 'loading' }}
        onPress={onPressSync}
        disabled={status === 'loading'}
        style={({ pressed }) => [styles.sync, status === 'loading' && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.syncText}>Sync</Text>
      </Pressable>
    </View>
  );
}

const { colors, spacing, radii, minTouchTarget, typography } = theme;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  avatar: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.headingStyle,
    fontSize: typography.fontSizes.subtitle,
    color: colors.text,
  },
  sport: {
    fontSize: typography.fontSizes.caption,
    color: colors.muted,
  },
  sportError: {
    color: colors.error,
  },
  sync: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  syncText: {
    fontSize: typography.fontSizes.caption,
    fontWeight: '700',
    color: colors.onAccent,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
