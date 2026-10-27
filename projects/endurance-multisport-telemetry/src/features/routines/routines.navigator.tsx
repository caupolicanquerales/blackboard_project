import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RoutinesStackParamList } from '../../core/navigation/types';
import { RoutinesScreen } from './screens/RoutinesScreen';
import { WorkoutDetailScreen } from './screens/WorkoutDetailScreen';
import { ActiveExecutionScreen } from './screens/ActiveExecutionScreen';

const Stack = createNativeStackNavigator<RoutinesStackParamList>();

export function RoutinesNavigator() {
  return (
    <Stack.Navigator initialRouteName="RoutinesList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutinesList" component={RoutinesScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="ActiveExecution" component={ActiveExecutionScreen} />
    </Stack.Navigator>
  );
}
