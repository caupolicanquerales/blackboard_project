import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { DashboardStackParamList } from '../../core/navigation/types';
import { DashboardScreen } from './screens/DashboardScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
