import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { Appointment } from '../../../../shared/models/appointment';
import type { MedicalOrder, Prescription } from '../../../../shared/models/patient';
import { useAppointmentsStore } from '../../../../core/store/appointments.store';
import { PriorityTriageBadge } from '../../../../shared/components/PriorityTriageBadge';
import { AppointmentStatusTimeline } from '../../../../shared/components/AppointmentStatusTimeline';
import { usePatientPortalStore } from '../../data/patient-portal.store';
import { PrescriptionPharmacyStatusCard } from '../../components/PrescriptionPharmacyStatusCard';
import type {
  PatientPortalNavigationProp,
  PatientPortalScreenState,
  PatientPortalTab,
} from './PatientPortalScreen.types';

const TABLET_WIDTH = 768;

const THEME = {
  background: '#F8FAFC',
  accent: '#0284C7',
  accentStrong: '#075985',
  text: '#0F172A',
  muted: '#334155',
  confirmed: '#10B981',
  priority: '#F59E0B',
  urgent: '#EF4444',
  gap: 12,
};

const TAB_ICONS: Record<PatientPortalTab, string> = {
  appointments: '📅',
  prescriptions: '💊',
  orders: '📋',
};

const TABS: { key: PatientPortalTab; label: string }[] = [
  { key: 'appointments', label: 'My Appointments' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'orders', label: 'Exams/Referrals' },
];

const EMPTY_MESSAGES: Record<PatientPortalTab, string> = {
  appointments: 'You have no appointments.',
  prescriptions: 'You have no prescriptions.',
  orders: 'You have no exams or referrals.',
};

const ORDER_TYPE_LABELS: Record<MedicalOrder['orderType'], string> = {
  SPECIALIST_REFERRAL: 'Referral',
  LAB_EXAM: 'Lab exam',
};

export function PatientPortalScreen() {
  const navigation = useNavigation<PatientPortalNavigationProp>();
  const { width } = useWindowDimensions();
  const numColumns = width >= TABLET_WIDTH ? 2 : 1;

  const patient = usePatientPortalStore((s) => s.patient);
  const prescriptions = usePatientPortalStore((s) => s.prescriptions);
  const orders = usePatientPortalStore((s) => s.orders);
  const portalStatus = usePatientPortalStore((s) => s.status);
  const reminders = usePatientPortalStore((s) => s.reminders);
  const banner = usePatientPortalStore((s) => s.banner);
  const load = usePatientPortalStore((s) => s.load);
  const toggleReminder = usePatientPortalStore((s) => s.toggleReminder);
  const dismissBanner = usePatientPortalStore((s) => s.dismissBanner);

  const allAppointments = useAppointmentsStore((s) => s.appointments);
  const requestAppointment = useAppointmentsStore((s) => s.requestAppointment);

  const [tab, setTab] = useState<PatientPortalTab>('appointments');

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appointments = allAppointments.filter((a) => a.patientId === patient.id);

  const listLength =
    tab === 'appointments'
      ? appointments.length
      : tab === 'prescriptions'
        ? prescriptions.length
        : orders.length;

  let state: PatientPortalScreenState;
  if (portalStatus === 'loading') state = 'loading';
  else if (portalStatus === 'error') state = 'error';
  else if (listLength === 0) state = 'empty';
  else state = 'success';

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={[styles.card, styles.cardAccent]} testID={`appointment-${item.id}`}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>
          {item.appointmentType === 'CONSULTATION' ? '🩺 Consultation' : '🏥 Procedure'}
        </Text>
        <PriorityTriageBadge severity={item.severityLevel} score={item.priorityScore} />
      </View>
      <AppointmentStatusTimeline status={item.status} />
    </View>
  );

  const renderPrescription = ({ item }: { item: Prescription }) => (
    <PrescriptionPharmacyStatusCard
      prescription={item}
      onPress={(p) => navigation.navigate('PrescriptionDetail', { prescriptionId: p.id })}
    />
  );

  const renderOrder = ({ item }: { item: MedicalOrder }) => (
    <View style={styles.card} testID={`order-${item.id}`}>
      <Text style={styles.cardTitle}>
        {item.orderType === 'LAB_EXAM' ? '🧪' : '📋'} {item.description}
      </Text>
      <Text style={styles.meta}>
        {ORDER_TYPE_LABELS[item.orderType]}
        {item.targetSpecialty ? ` · ${item.targetSpecialty}` : ''}
      </Text>
      <Text style={styles.meta}>Status: {item.status}</Text>
    </View>
  );

  const listProps = {
    key: `${tab}-${numColumns}`,
    numColumns,
    contentContainerStyle: styles.list,
    columnWrapperStyle: numColumns > 1 ? styles.columns : undefined,
    testID: 'state-success',
  };

  return (
    <SafeAreaView style={styles.root} testID="patient-portal-screen">
      {banner && (
        <View style={[styles.banner, banner.severity === 'error' && styles.bannerError]} testID="banner">
          <Text style={styles.bannerText}>{banner.message}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            onPress={dismissBanner}
            style={styles.touch}
          >
            <Text style={styles.bannerText}>✕</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.reminders}>
        <View style={styles.row}>
          <Text style={styles.label}>Reminder 24h before</Text>
          <Switch
            accessibilityLabel="Reminder 24h before"
            value={reminders.h24}
            onValueChange={() => toggleReminder('h24')}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Reminder day of</Text>
          <Switch
            accessibilityLabel="Reminder day of"
            value={reminders.dayOf}
            onValueChange={() => toggleReminder('dayOf')}
          />
        </View>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: tab === t.key }}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {TAB_ICONS[t.key]} {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'appointments' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Request new slot"
          onPress={() => requestAppointment(patient.id)}
          style={styles.action}
        >
          <Text style={styles.actionText}>Request new slot</Text>
        </Pressable>
      )}

      {state === 'loading' && (
        <View style={styles.center} testID="state-loading">
          <ActivityIndicator accessibilityLabel="Loading" />
        </View>
      )}
      {state === 'error' && (
        <View style={styles.center} testID="state-error">
          <Text style={styles.message}>Could not load your portal.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={() => void load()}
            style={styles.touch}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
      {state === 'empty' && (
        <View style={styles.center} testID="state-empty">
          <Text style={styles.message}>{EMPTY_MESSAGES[tab]}</Text>
        </View>
      )}
      {state === 'success' && tab === 'appointments' && (
        <FlatList {...listProps} data={appointments} keyExtractor={(i) => i.id} renderItem={renderAppointment} />
      )}
      {state === 'success' && tab === 'prescriptions' && (
        <FlatList {...listProps} data={prescriptions} keyExtractor={(i) => i.id} renderItem={renderPrescription} />
      )}
      {state === 'success' && tab === 'orders' && (
        <FlatList {...listProps} data={orders} keyExtractor={(i) => i.id} renderItem={renderOrder} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background, flexDirection: 'column', alignItems: 'stretch', gap: THEME.gap },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.accentStrong,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  bannerError: { backgroundColor: '#B91C1C' },
  bannerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', flexShrink: 1 },
  reminders: {
    marginHorizontal: 16,
    padding: 12,
    gap: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.accent,
    backgroundColor: '#FFFFFF',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 16, color: '#0F172A', fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.text,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  tabActive: { backgroundColor: '#0F172A' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  tabTextActive: { color: '#FFFFFF' },
  action: {
    marginHorizontal: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#075985',
  },
  actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  list: { padding: 16, gap: THEME.gap },
  columns: { gap: THEME.gap },
  card: {
    flex: 1,
    gap: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  cardAccent: { borderLeftWidth: 8, borderLeftColor: THEME.accent },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  meta: { fontSize: 16, color: '#334155' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  message: { fontSize: 16, color: '#334155' },
  touch: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  retryText: { fontSize: 16, fontWeight: '700', color: '#075985' },
});
