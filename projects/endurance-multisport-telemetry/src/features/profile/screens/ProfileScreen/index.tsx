import { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAthleteProfileStore } from '../../../../core/store/athlete-profile.store';
import { useResponsiveLayout } from '../../../../shared/hooks/useResponsiveLayout';
import { theme } from '../../../../shared/theme/tokens';
import type { LoadStatus } from '../../../../shared/models/load-status';
import type { ProfileScreenNavigationProp } from './ProfileScreen.types';

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const profile = useAthleteProfileStore((s) => s.profile);
  const storeStatus = useAthleteProfileStore((s) => s.status);
  const error = useAthleteProfileStore((s) => s.error);
  const loadProfile = useAthleteProfileStore((s) => s.loadProfile);
  const signOut = useAthleteProfileStore((s) => s.signOut);
  const { size } = useResponsiveLayout();

  useEffect(() => {
    if (storeStatus === 'idle' && !profile) {
      void loadProfile();
    }
  }, [storeStatus, profile, loadProfile]);

  let status: LoadStatus = 'loading';
  if (storeStatus === 'error') status = 'error';
  else if (storeStatus === 'success') status = profile ? 'success' : 'empty';

  const handleSignOut = () => {
    signOut();
    if (navigation.canGoBack()) {
      navigation.popToTop();
    }
  };

  const metrics = profile
    ? [
        { key: 'weight', label: 'Weight', value: `${profile.weightKg} kg` },
        { key: 'resting', label: 'Resting HR', value: `${profile.restingHeartRate} bpm` },
        { key: 'max', label: 'Max HR', value: `${profile.maxHeartRate} bpm` },
        { key: 'ftp', label: 'FTP', value: `${profile.ftpWatts} W` },
      ]
    : [];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {status === 'loading' && (
          <View style={styles.center} accessibilityLiveRegion="polite">
            <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading profile" />
          </View>
        )}
        {status === 'error' && (
          <View style={styles.center} accessibilityRole="alert">
            <Text style={styles.errorText}>{error ?? 'Failed to load profile'}</Text>
            <Pressable
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="Retry loading profile"
              onPress={() => void loadProfile()}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        )}
        {status === 'empty' && (
          <View style={styles.center}>
            <Text style={styles.muted}>No profile available</Text>
          </View>
        )}
        {status === 'success' && profile && (
          <>
            <View style={styles.header}>
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.avatar}
                accessibilityLabel={`${profile.displayName} avatar`}
              />
              <Text style={styles.name} accessibilityRole="header">
                {profile.displayName}
              </Text>
              <Text style={styles.muted}>{profile.role}</Text>
            </View>
            <View style={[styles.metrics, size === 'medium' && styles.metricsRow]}>
              {metrics.map((m) => (
                <View
                  key={m.key}
                  style={[styles.card, size === 'medium' && styles.cardMedium]}
                  accessible
                  accessibilityLabel={`${m.label} ${m.value}`}
                >
                  <Text style={styles.muted}>{m.label}</Text>
                  <Text style={styles.value}>{m.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {profile && (
          <Pressable
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleSignOut}
          >
            <Text style={styles.buttonText}>Sign out</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, alignItems: 'stretch' },
  center: { alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg },
  header: { alignItems: 'center', gap: theme.spacing.sm },
  avatar: { width: 96, height: 96, borderRadius: theme.radii.pill, backgroundColor: theme.colors.surface },
  name: { ...theme.typography.headingStyle, color: theme.colors.text, fontSize: theme.typography.fontSizes.heading },
  metrics: { gap: theme.spacing.md },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.xxs,
  },
  cardMedium: { flexGrow: 1, flexBasis: '45%' },
  value: { ...theme.typography.headingStyle, color: theme.colors.text, fontSize: theme.typography.fontSizes.subtitle },
  muted: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body },
  errorText: { color: theme.colors.error, fontSize: theme.typography.fontSizes.body },
  button: {
    minHeight: theme.minTouchTarget,
    minWidth: theme.minTouchTarget,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  buttonText: { ...theme.typography.headingStyle, color: theme.colors.onAccent, fontSize: theme.typography.fontSizes.body },
});
