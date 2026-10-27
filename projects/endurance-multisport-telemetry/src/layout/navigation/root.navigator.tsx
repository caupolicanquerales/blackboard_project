import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootTabParamList } from '../../core/navigation/types';
import { theme } from '../../shared/theme/tokens';
import { DashboardNavigator } from '../../features/dashboard/dashboard.navigator';
import { RoutinesNavigator } from '../../features/routines/routines.navigator';
import { ProfileNavigator } from '../../features/profile/profile.navigator';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICONS: Record<keyof RootTabParamList, IconName> = {
  Dashboard: 'heart-pulse',
  Routines: 'lightning-bolt',
  Profile: 'run',
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: theme.minTouchTarget + theme.spacing.lg,
        },
        tabBarItemStyle: { minHeight: theme.minTouchTarget },
        tabBarLabelStyle: { fontSize: theme.typography.fontSizes.caption },
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Routines" component={RoutinesNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
