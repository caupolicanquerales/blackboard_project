import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ClinicalAgendaStackParamList } from '../../core/navigation/types';
import { ClinicalAgendaScreen } from './screens/ClinicalAgendaScreen';
import { AppointmentModifierScreen } from './screens/AppointmentModifierScreen';

const Stack = createNativeStackNavigator<ClinicalAgendaStackParamList>();

export function ClinicalAgendaNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ClinicalAgendaHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ClinicalAgendaHome" component={ClinicalAgendaScreen} />
      <Stack.Screen
        name="AppointmentModifier"
        component={AppointmentModifierScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
