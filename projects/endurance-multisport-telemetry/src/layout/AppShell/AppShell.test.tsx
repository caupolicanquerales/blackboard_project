import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppShell } from './index';
import { useAthleteProfileStore } from '../../core/store/athlete-profile.store';
import { useNotificationStore } from '../../core/store/notification.store';

describe('AppShell', () => {
  beforeEach(() => {
    useAthleteProfileStore.setState({ profile: null, status: 'success' });
    useNotificationStore.setState({ queue: [] });
  });

  it('renders header and children outlet', async () => {
    await render(
      <AppShell>
        <Text>outlet</Text>
      </AppShell>,
    );
    expect(screen.getByText('ENDURANCE TELEMETRY')).toBeTruthy();
    expect(screen.getByText('outlet')).toBeTruthy();
  });

  it('renders queued toasts', async () => {
    useNotificationStore.setState({
      queue: [{ id: 't1', message: 'Synced OK', severity: 'info', createdAt: new Date().toISOString(), timeoutMs: 0 }],
    });
    await render(<AppShell />);
    expect(screen.getByText('Synced OK')).toBeTruthy();
  });
});
