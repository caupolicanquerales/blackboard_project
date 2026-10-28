import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppointmentsStore } from '../../../../core/store/appointments.store';
import type { AppointmentViewFilter } from '../../../../core/store/appointments.store';
import { useNotificationsStore } from '../../../../core/store/notifications.store';
import { useSessionStore } from '../../../../core/store/session.store';
import type { ClinicalAgendaStackParamList } from '../../../../core/navigation/types';
import type { Appointment } from '../../../../shared/models/appointment';
import { AppointmentCard } from '../../components/AppointmentCard';
import { AppointmentStatusTimeline } from '../../../../shared/components/AppointmentStatusTimeline';
import { PriorityTriageBadge } from '../../../../shared/components/PriorityTriageBadge';
import { theme } from '../../../../shared/theme/theme';
import type { CalendarRange, ClinicalAgendaToast, ClinicalAgendaViewState } from './ClinicalAgendaScreen.types';

const TABLET_MIN_WIDTH = 768;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PHONE = '+5491155550000';
const TOAST_DURATION_MS = 4000;

type AgendaTab = 'priority' | 'day' | 'week';

const TABS: { key: AgendaTab; label: string; a11y: string }[] = [
  { key: 'priority', label: 'Priority list', a11y: 'Priority list' },
  { key: 'day', label: 'Day', a11y: 'Day view' },
  { key: 'week', label: 'Week', a11y: 'Week view' },
];

const FILTERS: { key: AppointmentViewFilter; label: string }[] = [
  { key: 'CONSULTATION', label: 'Consultations' },
  { key: 'SURGICAL_PROCEDURE', label: 'Surgical procedures' },
];

const isHighPriority = (a: Appointment): boolean => a.severityLevel === 'URGENT' || a.severityLevel === 'HIGH';

const inRange = (a: Appointment, range: CalendarRange): boolean => {
  const time = new Date(a.scheduledTime).getTime();
  // Unscheduled appointments stay visible so triage is never hidden.
  if (Number.isNaN(time)) return true;
  const now = Date.now();
  const span = range === 'day' ? DAY_MS : 7 * DAY_MS;
  return time >= now - DAY_MS && time <= now + span;
};

export function ClinicalAgendaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClinicalAgendaStackParamList, 'ClinicalAgendaHome'>>();
  const { width } = useWindowDimensions();
  const numColumns = width >= TABLET_MIN_WIDTH ? 2 : 1;

  const appointments = useAppointmentsStore((s) => s.appointments);
  const status = useAppointmentsStore((s) => s.status);
  const viewFilter = useAppointmentsStore((s) => s.viewFilter);
  const setViewFilter = useAppointmentsStore((s) => s.setViewFilter);
  const load = useAppointmentsStore((s) => s.load);
  const refresh = useAppointmentsStore((s) => s.refresh);
  const sendWhatsApp = useNotificationsStore((s) => s.sendWhatsApp);
  const requireCall = useNotificationsStore((s) => s.requireCall);
  const canAccess = useSessionStore((s) => s.canAccess);
  const role = useSessionStore((s) => s.role);

  const [tab, setTab] = useState<AgendaTab>('week');
  const range: CalendarRange = tab === 'day' ? 'day' : 'week';
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ClinicalAgendaToast | null>(null);
  const seenIds = useRef<Set<string> | null>(null);

  const canView = useMemo(() => canAccess('appointment', 'schedule'), [canAccess, role]);

  useEffect(() => {
    if (canView) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(appointments.map((a) => a.id));
      return;
    }
    const seen = seenIds.current;
    const fresh = appointments.filter((a) => !seen.has(a.id));
    fresh.forEach((a) => seen.add(a.id));
    const urgent = fresh.find(isHighPriority);
    if (urgent) setToast({ id: urgent.id, message: `New high-priority patient: ${urgent.patientName}` });
  }, [appointments]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const data = useMemo(
    () =>
      appointments
        .filter((a) => a.appointmentType === viewFilter && (tab === 'priority' || inRange(a, range)))
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [appointments, viewFilter, range, tab],
  );

  const viewState: ClinicalAgendaViewState =
    status === 'loading' && appointments.length === 0
      ? 'loading'
      : status === 'error'
        ? 'error'
        : data.length === 0
          ? 'empty'
          : 'success';

  const metrics = useMemo(() => {
    const scoped = appointments.filter((a) => a.appointmentType === viewFilter);
    return {
      urgent: scoped.filter((a) => a.severityLevel === 'URGENT').length,
      priority: scoped.filter((a) => a.severityLevel === 'HIGH').length,
      total: scoped.length,
    };
  }, [appointments, viewFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleWhatsApp = useCallback(
    (a: Appointment) => {
      sendWhatsApp(a.id, DEFAULT_PHONE, 'appointment_reminder').catch(() =>
        Alert.alert('WhatsApp failed', `Could not send the message to ${a.patientName}.`),
      );
    },
    [sendWhatsApp],
  );

  const handleCall = useCallback((a: Appointment) => requireCall(a.id, DEFAULT_PHONE), [requireCall]);

  const openModifier = useCallback(
    (a: Appointment) => navigation.navigate('AppointmentModifier', { appointmentId: a.id }),
    [navigation],
  );

  const handleReschedule = useCallback(
    (a: Appointment) => {
      if (!canAccess('appointment', 'reschedule')) {
        Alert.alert('Not allowed', 'Your role cannot modify the schedule.');
        return;
      }
      Alert.alert('Override schedule?', `Modify the scheduled slot for ${a.patientName}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Override', style: 'destructive', onPress: () => openModifier(a) },
      ]);
    },
    [canAccess, openModifier],
  );

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={[styles.item, numColumns > 1 && styles.itemColumn]}>
      <AppointmentCard
        appointment={item}
        onSendWhatsApp={handleWhatsApp}
        onRequireCall={handleCall}
        onReschedule={handleReschedule}
        onPress={openModifier}
      />
      <View style={styles.meta}>
        <PriorityTriageBadge severity={item.severityLevel} score={item.priorityScore} />
        <AppointmentStatusTimeline status={item.status} />
      </View>
    </View>
  );

  if (!canView) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.message}>You do not have access to the clinical agenda.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Text accessibilityRole="header" style={styles.title}>
        Clinical agenda
      </Text>

      <View style={styles.metricsRow} accessibilityRole="summary" accessibilityLabel="Priority summary">
        <View style={[styles.metric, { backgroundColor: theme.colors.statusSurface.urgent }]}>
          <Text style={[styles.metricValue, { color: theme.colors.statusText.urgent }]}>{metrics.urgent}</Text>
          <Text style={[styles.metricLabel, { color: theme.colors.statusText.urgent }]}>Urgent</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: theme.colors.statusSurface.priority }]}>
          <Text style={[styles.metricValue, { color: theme.colors.statusText.priority }]}>{metrics.priority}</Text>
          <Text style={[styles.metricLabel, { color: theme.colors.statusText.priority }]}>Priority</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: theme.colors.statusSurface.confirmed }]}>
          <Text style={[styles.metricValue, { color: theme.colors.statusText.confirmed }]}>{metrics.total}</Text>
          <Text style={[styles.metricLabel, { color: theme.colors.statusText.confirmed }]}>Total</Text>
        </View>
      </View>

      <View style={styles.segmented} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityLabel={t.a11y}
            accessibilityState={{ selected: tab === t.key }}
            onPress={() => setTab(t.key)}
            style={[styles.segment, tab === t.key && styles.segmentActive]}
          >
            <Text style={[styles.chipText, tab === t.key && styles.chipTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.toolbar}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            accessibilityRole="button"
            accessibilityLabel={f.label}
            accessibilityState={{ selected: viewFilter === f.key }}
            onPress={() => setViewFilter(f.key)}
            style={[styles.chip, viewFilter === f.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, viewFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {toast ? (
        <View accessibilityRole="alert" style={styles.toast}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}

      {viewState === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel="Loading" size="large" color={theme.colors.accent} />
        </View>
      ) : viewState === 'error' ? (
        <View style={styles.center}>
          <Text style={styles.message}>Could not load the agenda.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry" onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={data}
          keyExtractor={(a) => a.id}
          numColumns={numColumns}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.message}>No appointments to show.</Text>
            </View>
          }
        />
      )}

      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh agenda"
          accessibilityState={{ busy: refreshing }}
          onPress={() => void onRefresh()}
          style={styles.actionButton}
        >
          <Text style={styles.retryText}>{refreshing ? 'Refreshing…' : '🔄 Refresh agenda'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'column', alignItems: 'stretch', gap: 12, backgroundColor: theme.colors.background },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl },
  toolbar: { flexDirection: 'row', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl },
  metricsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: theme.spacing.xl },
  metric: { flex: 1, padding: theme.spacing.lg, borderRadius: theme.radii.md, alignItems: 'center' },
  metricValue: { ...theme.typography.h2 },
  metricLabel: { ...theme.typography.caption },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceAlt,
  },
  segment: {
    flex: 1,
    minHeight: theme.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
  },
  segmentActive: { backgroundColor: theme.colors.accent },
  actionBar: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    minHeight: theme.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
  },
  chip: {
    minHeight: theme.minTouchTarget,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { ...theme.typography.bodyStrong, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.onAccent },
  toast: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.statusSurface.urgent,
    borderColor: theme.colors.status.urgent,
    borderWidth: 1,
  },
  toastText: { ...theme.typography.bodyStrong, color: theme.colors.statusText.urgent },
  list: { padding: theme.spacing.xl, gap: 12, flexGrow: 1 },
  item: { flex: 1, gap: theme.spacing.md },
  itemColumn: { marginHorizontal: theme.spacing.md },
  meta: { gap: theme.spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg },
  message: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.xl },
  retry: {
    minHeight: theme.minTouchTarget,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
  },
  retryText: { ...theme.typography.bodyStrong, color: theme.colors.onAccent },
});
