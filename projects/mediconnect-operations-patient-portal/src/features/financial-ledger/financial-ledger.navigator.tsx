import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FinancialLedgerStackParamList } from '../../core/navigation/types';
import { FinancialLedgerScreen } from './screens/FinancialLedgerScreen';
import { ReceiptScannerScreen } from './screens/ReceiptScannerScreen';

const Stack = createNativeStackNavigator<FinancialLedgerStackParamList>();

export function FinancialLedgerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="FinancialLedgerHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="FinancialLedgerHome" component={FinancialLedgerScreen} />
      <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
    </Stack.Navigator>
  );
}
