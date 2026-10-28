import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MessagingHubStackParamList } from '../../core/navigation/types';
import { MessagingHubScreen } from './screens/MessagingHubScreen';

const Stack = createNativeStackNavigator<MessagingHubStackParamList>();

export function MessagingHubNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MessagingHubHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MessagingHubHome" component={MessagingHubScreen} />
    </Stack.Navigator>
  );
}
