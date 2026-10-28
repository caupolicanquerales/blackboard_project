import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NotificationLog, NotificationStatus } from '../../../../shared/models/notification-log';
import type { CallQueueBarProps } from './CallQueueBar.types';

export function deliveryMark(status: NotificationStatus): string {
  switch (status) {
    case 'PENDING':
      return '✓';
    case 'SENT':
    case 'CALL_COMPLETED':
      return '✓✓';
    default:
      return '';
  }
}

export function CallQueueBar({ pendingCalls, onCall, onWhatsApp, onMarkCompleted }: CallQueueBarProps) {
  return (
    <View style={styles.container} testID="call-queue-bar">
      <View style={styles.header}>
        <Text style={styles.title}>Call queue</Text>
        <View style={styles.badge} testID="pending-calls-badge">
          <Text style={styles.badgeText}>{pendingCalls.length}</Text>
        </View>
      </View>
      <FlatList
        data={pendingCalls}
        keyExtractor={(item: NotificationLog) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.phone}>{item.recipientPhone}</Text>
              <Text style={styles.meta}>
                {item.appointmentId} <Text testID={`delivery-${item.id}`}>{deliveryMark(item.status)}</Text>
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Call ${item.recipientPhone}`} onPress={() => onCall(item)} style={styles.action}>
              <Text>Call</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`WhatsApp ${item.recipientPhone}`} onPress={() => onWhatsApp(item)} style={styles.action}>
              <Text>WhatsApp</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Mark completed ${item.recipientPhone}`} onPress={() => onMarkCompleted(item)} style={styles.action}>
              <Text>Done</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { fontWeight: '600' },
  badge: { marginLeft: 8, minWidth: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center' },
  badgeText: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  info: { flex: 1 },
  phone: { fontWeight: '500' },
  meta: {},
  action: { paddingHorizontal: 8, paddingVertical: 4 },
});
