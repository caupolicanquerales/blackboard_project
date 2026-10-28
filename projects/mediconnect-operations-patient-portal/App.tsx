import React from 'react';
import { AppProviders } from './src/app/providers';
import { AppShell } from './src/layout/Shell';

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
