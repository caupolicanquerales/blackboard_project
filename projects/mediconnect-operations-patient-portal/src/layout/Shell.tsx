import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessionStore } from '../core/store/session.store';
import { theme } from '../shared/theme/theme';
import { RoleSwitcherHeader } from './RoleSwitcherHeader';
import { RootNavigator } from './RootNavigator';

export interface AppShellProps {
  actionBar?: React.ReactNode;
}

export function AppShell({ actionBar }: AppShellProps) {
  const activeView = useSessionStore((state) => state.profileView);
  const location = useSessionStore((state) => state.location);
  const pendingNotificationCount = useSessionStore((state) => state.pendingNotificationCount);
  const switchProfileView = useSessionStore((state) => state.switchProfileView);

  return (
    <SafeAreaView style={styles.root} testID="app-shell">
      <RoleSwitcherHeader
        activeView={activeView}
        location={location}
        pendingNotificationCount={pendingNotificationCount}
        onSwitch={switchProfileView}
      />
      <View style={styles.content} testID="app-shell-content">
        <RootNavigator />
      </View>
      {actionBar ? (
        <View style={styles.actionBar} testID="app-shell-action-bar">
          {actionBar}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  actionBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
