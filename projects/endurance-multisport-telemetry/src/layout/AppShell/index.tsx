import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useAthleteProfileStore } from '../../core/store/athlete-profile.store';
import { useNotificationStore } from '../../core/store/notification.store';
import { theme } from '../../shared/theme/tokens';
import type { LoadStatus } from '../../shared/models/load-status';
import { AthleteHeaderBanner } from '../AthleteHeaderBanner';
import { ToastBannerHost } from '../ToastBannerHost';
import type { AppShellProps } from './AppShell.types';

const noop = () => undefined;

export function AppShell({ children }: AppShellProps) {
  const { profile, storeStatus, loadProfile } = useAthleteProfileStore(
    useShallow((s) => ({ profile: s.profile, storeStatus: s.status, loadProfile: s.loadProfile })),
  );
  const { queue, dismiss } = useNotificationStore(
    useShallow((s) => ({ queue: s.queue, dismiss: s.dismiss })),
  );

  let status: LoadStatus = 'loading';
  if (storeStatus === 'error') status = 'error';
  else if (storeStatus === 'success') status = profile ? 'success' : 'empty';

  return (
    <SafeAreaView style={styles.root}>
      <AthleteHeaderBanner
        profile={profile}
        status={status}
        onPressSync={() => void loadProfile()}
        onPressAvatar={noop}
      />
      <ToastBannerHost notifications={queue} onDismiss={dismiss} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
