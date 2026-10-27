import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SeedProvider } from './src/core/providers/seed.provider';
import { AppShell } from './src/layout/AppShell';
import { RootNavigator } from './src/layout/navigation/root.navigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SeedProvider>
          <AppShell>
            <RootNavigator />
          </AppShell>
          <StatusBar style="light" />
        </SeedProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
