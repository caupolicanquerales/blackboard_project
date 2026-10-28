import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppointmentsStore } from '../../../../core/store/appointments.store';
import type { ClinicalAgendaStackParamList } from '../../../../core/navigation/types';
import type { AppointmentModifierViewState, SlotOption } from './AppointmentModifierScreen.types';

export function AppointmentModifierScreen() {
  const route = useRoute<RouteProp<ClinicalAgendaStackParamList, 'AppointmentModifier'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ClinicalAgendaStackParamList, 'AppointmentModifier'>>();
  const { appointmentId } = route.params;

  const appointments = useAppointmentsStore((s) => s.appointments);
  const schedules = useAppointmentsStore((s) => s.schedules);
  const storeStatus = useAppointmentsStore((s) => s.status);
  const load = useAppointmentsStore((s) => s.load);
  const modifyAppointment = useAppointmentsStore((s) => s.modifyAppointment);
  const reassignDoctor = useAppointmentsStore((s) => s.reassignDoctor);

  const appointment = appointments.find((a) => a.id === appointmentId);
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined);
  const [slot, setSlot] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  const selectedDoctorId = doctorId ?? appointment?.doctorId ?? '';
  const selectedSlot = slot ?? appointment?.scheduledTime ?? '';
  const schedule = schedules.find((s) => s.doctorId === selectedDoctorId);

  const slots = useMemo<SlotOption[]>(() => {
    if (!schedule) return [];
    const blocked = new Set(schedule.blockedSlots);
    const times = Array.from(new Set([...schedule.availableSlots, ...schedule.blockedSlots])).sort();
    return times.map((time) => ({ time, blocked: blocked.has(time) }));
  }, [schedule]);

  const viewState: AppointmentModifierViewState = saved
    ? 'success'
    : storeStatus === 'loading'
      ? 'loading'
      : storeStatus === 'error'
        ? 'error'
        : !appointment
          ? 'empty'
          : 'success';

  const selectDoctor = (id: string) => {
    setDoctorId(id);
    setSlot('');
  };

  const persist = () => {
    if (!appointment) return;
    if (selectedDoctorId !== appointment.doctorId) reassignDoctor(appointment.id, selectedDoctorId);
    if (selectedSlot !== appointment.scheduledTime) modifyAppointment(appointment.id, { scheduledTime: selectedSlot });
    setSaved(true);
  };

  const handleSave = () => {
    if (!appointment) return;
    const conflict = schedule?.blockedSlots.includes(selectedSlot) && selectedSlot !== appointment.scheduledTime;
    if (conflict) {
      Alert.alert(
        'Schedule override',
        'This slot is blocked or conflicts with the doctor\'s schedule. Override and save anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Override', style: 'destructive', onPress: persist },
        ],
      );
      return;
    }
    persist();
  };

  if (viewState === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator accessibilityLabel="Loading" />
      </SafeAreaView>
    );
  }

  if (viewState === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Could not load appointment data.</Text>
        <Pressable accessibilityRole="button" onPress={() => void load()}>
          <Text>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (viewState === 'empty' || !appointment) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Appointment not found.</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (saved) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Appointment updated.</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text>Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{appointment.patientName}</Text>
      <Text>Doctor</Text>
      <View style={styles.row}>
        {schedules.map((s) => (
          <Pressable
            key={s.doctorId}
            accessibilityRole="button"
            accessibilityState={{ selected: s.doctorId === selectedDoctorId }}
            onPress={() => selectDoctor(s.doctorId)}
          >
            <Text style={s.doctorId === selectedDoctorId ? styles.selected : undefined}>{s.doctorName}</Text>
          </Pressable>
        ))}
      </View>
      <Text>Time slot</Text>
      <FlatList
        data={slots}
        keyExtractor={(item) => item.time}
        ListEmptyComponent={<Text>No slots available.</Text>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.time === selectedSlot }}
            onPress={() => setSlot(item.time)}
          >
            <Text style={item.time === selectedSlot ? styles.selected : undefined}>
              {item.time}
              {item.blocked ? ' (blocked)' : ''}
            </Text>
          </Pressable>
        )}
      />
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleSave}>
          <Text>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  selected: { fontWeight: '700' },
});
