import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { RootStackParamList } from '../core/navigation/types';
import { useSessionStore } from '../core/store/session.store';
import { ClinicalAgendaNavigator } from '../features/clinical-agenda/clinical-agenda.navigator';
import { FinancialLedgerNavigator } from '../features/financial-ledger/financial-ledger.navigator';
import { MessagingHubNavigator } from '../features/messaging-hub/messaging-hub.navigator';
import { PatientPortalNavigator } from '../features/patient-portal/patient-portal.navigator';
import { theme } from '../shared/theme/theme';

const Tab = createBottomTabNavigator<RootStackParamList>();

const TAB_TITLES: Record<keyof RootStackParamList, string> = {
  ClinicalAgenda: 'Agenda',
  PatientPortal: 'My Portal',
  MessagingHub: 'Messages',
  FinancialLedger: 'Finance',
};

const TAB_COMPONENTS: Record<keyof RootStackParamList, React.ComponentType> = {
  ClinicalAgenda: ClinicalAgendaNavigator,
  PatientPortal: PatientPortalNavigator,
  MessagingHub: MessagingHubNavigator,
  FinancialLedger: FinancialLedgerNavigator,
};

export function RootNavigator() {
  const tabs = useSessionStore((state) => state.tabs);
  const pendingCount = useSessionStore((state) => state.pendingNotificationCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accentStrong,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      {tabs.map((name) => {
        const routeName = name as keyof RootStackParamList;
        const badge = routeName === 'MessagingHub' && pendingCount > 0 ? pendingCount : undefined;
        return (
          <Tab.Screen
            key={routeName}
            name={routeName}
            component={TAB_COMPONENTS[routeName]}
            options={{
              title: TAB_TITLES[routeName],
              tabBarBadge: badge,
              tabBarBadgeStyle: { backgroundColor: theme.colors.error, color: theme.colors.onAccent },
              tabBarAccessibilityLabel:
                badge !== undefined ? `${TAB_TITLES[routeName]}, ${badge} pending calls` : TAB_TITLES[routeName],
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
