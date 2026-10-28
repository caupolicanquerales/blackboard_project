import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PatientPortalStackParamList } from '../../core/navigation/types';
import { PatientPortalScreen } from './screens/PatientPortalScreen';
import { PrescriptionDetailScreen } from './screens/PrescriptionDetailScreen';

const Stack = createNativeStackNavigator<PatientPortalStackParamList>();

export function PatientPortalNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="PatientPortalHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="PatientPortalHome" component={PatientPortalScreen} />
      <Stack.Screen
        name="PrescriptionDetail"
        component={PrescriptionDetailScreen}
      />
    </Stack.Navigator>
  );
}
