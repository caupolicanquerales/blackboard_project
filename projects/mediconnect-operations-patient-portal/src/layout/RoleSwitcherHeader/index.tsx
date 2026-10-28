import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ProfileView } from '../../shared/models/common';
import type { RoleSwitcherHeaderProps } from './RoleSwitcherHeader.types';

const VIEWS: { view: ProfileView; label: string }[] = [
  { view: 'patient', label: 'Patient' },
  { view: 'doctor', label: 'Doctor' },
  { view: 'staff', label: 'Staff' },
];

const tokens = {
  background: '#F8FAFC',
  accent: '#0284C7',
  text: '#0F172A',
  muted: '#334155',
  border: '#CBD5E1',
  urgent: '#B91C1C',
  gap: 8,
  minTarget: 44,
};

export function RoleSwitcherHeader({ activeView, location, pendingNotificationCount, onSwitch }: RoleSwitcherHeaderProps) {
  const badgeLabel =
    pendingNotificationCount === 1 ? '1 pending notification' : `${pendingNotificationCount} pending notifications`;
  return (
    <SafeAreaView edges={['top']} style={styles.container} testID="role-switcher-header">
      <View style={styles.row}>
        <Text
          style={styles.location}
          numberOfLines={1}
          testID="location-indicator"
          accessibilityLabel={`Location ${location}`}
        >
          {location}
        </Text>
        <View style={styles.segmented} accessibilityRole="tablist">
          {VIEWS.map(({ view, label }) => {
            const selected = view === activeView;
            return (
              <Pressable
                key={view}
                accessibilityRole="button"
                accessibilityLabel={`${label} view`}
                accessibilityState={{ selected }}
                onPress={() => onSwitch(view)}
                style={({ pressed }) => [styles.segment, selected && styles.segmentActive, pressed && styles.pressed]}
                testID={`segment-${view}`}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View
          accessible
          style={[styles.badge, pendingNotificationCount === 0 && styles.badgeEmpty]}
          testID="notification-badge"
          accessibilityRole="text"
          accessibilityLabel={badgeLabel}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.badgeText} testID="notification-badge-count">
            {pendingNotificationCount}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: tokens.background, paddingHorizontal: 12, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: tokens.gap,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: { flexShrink: 1, maxWidth: '30%', fontSize: 14, fontWeight: '600', color: tokens.muted },
  segmented: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: tokens.minTarget,
    minWidth: tokens.minTarget,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: tokens.accent },
  pressed: { opacity: 0.7 },
  segmentText: { fontSize: 14, fontWeight: '500', color: tokens.text },
  segmentTextActive: { fontWeight: '700', color: '#FFFFFF' },
  badge: {
    minWidth: tokens.minTarget,
    minHeight: tokens.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.minTarget / 2,
    backgroundColor: tokens.urgent,
  },
  badgeEmpty: { backgroundColor: tokens.border },
  badgeText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
