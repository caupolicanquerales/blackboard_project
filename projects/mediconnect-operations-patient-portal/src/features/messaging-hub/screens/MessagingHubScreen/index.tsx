import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationsStore } from '../../../../core/store/notifications.store';
import { useAppointmentsStore } from '../../../../core/store/appointments.store';
import { messagingGatewayService } from '../../../../core/services/messaging-gateway.service';
import { theme } from '../../../../shared/theme/theme';
import type { NotificationLog } from '../../../../shared/models/notification-log';
import { CallQueueBar, deliveryMark } from '../../components/CallQueueBar';
import type { MessagingHubActionItem, MessagingHubViewState } from './MessagingHubScreen.types';

const DEFAULT_TEMPLATE = 'appointment_reminder';

export function MessagingHubScreen() {
  const logs = useNotificationsStore((s) => s.logs);
  const dispatchState = useNotificationsStore((s) => s.dispatchState);
  const sendWhatsApp = useNotificationsStore((s) => s.sendWhatsApp);
  const completeCall = useNotificationsStore((s) => s.completeCall);
  const resend = useNotificationsStore((s) => s.resend);
  const appointments = useAppointmentsStore((s) => s.appointments);
  const appointmentsStatus = useAppointmentsStore((s) => s.status);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingCalls = useMemo(() => logs.filter((l) => l.status === 'CALL_REQUIRED'), [logs]);

  const items: MessagingHubActionItem[] = useMemo(() => {
    const names = new Map(appointments.map((a) => [a.id, a.patientName]));
    return logs.map((log) => ({
      log,
      patientName: names.get(log.appointmentId) ?? log.appointmentId,
      deliveryMark: deliveryMark(log.status),
    }));
  }, [logs, appointments]);

  const viewState: MessagingHubViewState =
    appointmentsStatus === 'loading'
      ? 'loading'
      : appointmentsStatus === 'error'
        ? 'error'
        : items.length === 0
          ? 'empty'
          : 'ready';

  const run = useCallback(async (action: () => Promise<unknown> | unknown) => {
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    }
  }, []);

  const handleWhatsApp = useCallback(
    (log: NotificationLog) =>
      run(async () => {
        const text = log.messageTemplate || DEFAULT_TEMPLATE;
        await sendWhatsApp(log.appointmentId, log.recipientPhone, text);
        await Linking.openURL(messagingGatewayService.buildWhatsAppUrl(log.recipientPhone, text));
      }),
    [run, sendWhatsApp],
  );

  const handleCall = useCallback(
    (log: NotificationLog) =>
      run(() => Linking.openURL(messagingGatewayService.buildDialerUrl(log.recipientPhone))),
    [run],
  );

  const handleComplete = useCallback(
    (log: NotificationLog) => run(() => completeCall(log.id)),
    [run, completeCall],
  );

  const handleResend = useCallback((log: NotificationLog) => run(() => resend(log.id)), [run, resend]);

  const renderBody = () => {
    if (viewState === 'loading')
      return (
        <View style={styles.stateBox} accessibilityLiveRegion="polite">
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText} testID="state-loading">Loading…</Text>
        </View>
      );
    if (viewState === 'error')
      return (
        <View style={styles.stateBox} accessibilityRole="alert">
          <Text style={[styles.stateText, styles.errorText]} testID="state-error">
            Could not load appointments.
          </Text>
        </View>
      );
    if (viewState === 'empty')
      return (
        <View style={styles.stateBox}>
          <Text style={styles.stateText} testID="state-empty">No messages to action.</Text>
        </View>
      );
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.log.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const failed = item.log.status === 'FAILED';
          const statusLabel = item.log.status.replace(/_/g, ' ');
          const delivered = item.deliveryMark === '✓✓' ? 'delivered' : item.deliveryMark ? 'sent' : 'no delivery';
          return (
            <View
              style={[styles.row, failed && styles.rowFailed]}
              testID={`action-item-${item.log.id}`}
              accessible
              accessibilityLabel={`${item.patientName}, ${item.log.channel}, ${statusLabel}, ${delivered}`}
            >
              <View style={styles.info}>
                <Text style={styles.name}>{item.patientName}</Text>
                <Text style={[styles.meta, failed && styles.failedText]}>
                  {item.log.channel} · {statusLabel}{' '}
                  <Text style={styles.mark} testID={`delivery-${item.log.id}`}>{item.deliveryMark}</Text>
                </Text>
              </View>
              {failed && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Resend ${item.log.id}`}
                  onPress={() => handleResend(item.log)}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                >
                  <Text style={styles.actionText}>Resend</Text>
                </Pressable>
              )}
              {item.log.channel === 'WHATSAPP' && !failed && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Send WhatsApp ${item.log.id}`}
                  onPress={() => handleWhatsApp(item.log)}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                >
                  <Text style={styles.actionText}>WhatsApp</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="messaging-hub-screen">
      <Text style={styles.title} accessibilityRole="header">Messaging Hub</Text>
      <Text
        style={styles.meta}
        testID="dispatch-state"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Dispatch status: ${dispatchState}`}
      >
        {dispatchState}
      </Text>
      {actionError ? (
        <Text style={styles.errorBanner} testID="action-error" accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {actionError}
        </Text>
      ) : null}
      <CallQueueBar
        pendingCalls={pendingCalls}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
        onMarkCompleted={handleComplete}
      />
      <View style={styles.body}>{renderBody()}</View>
    </SafeAreaView>
  );
}

const { colors, spacing, radii, typography, minTouchTarget } = theme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  body: { flex: 1 },
  list: { gap: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    minHeight: minTouchTarget,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowFailed: { borderColor: colors.status.urgent, backgroundColor: colors.statusSurface.urgent },
  info: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.textPrimary },
  failedText: { color: colors.statusText.urgent },
  mark: { color: colors.statusText.confirmed, fontWeight: '700' },
  action: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.accentStrong,
  },
  actionText: { ...typography.bodyStrong, color: colors.onAccent },
  pressed: { opacity: 0.8 },
  stateBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  stateText: { ...typography.body, color: colors.textSecondary },
  errorText: { color: colors.error },
  errorBanner: {
    ...typography.bodyStrong,
    color: colors.statusText.urgent,
    backgroundColor: colors.statusSurface.urgent,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
});
