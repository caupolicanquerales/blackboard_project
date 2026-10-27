import { fireEvent, render, screen } from '@testing-library/react-native';
import { AthleteHeaderBanner } from './index';
import type { AthleteProfile } from '../../core/models/athlete-profile';

const profile: AthleteProfile = {
  id: '1',
  displayName: 'Ana',
  role: 'ATHLETE',
  avatarUri: 'https://example.com/a.png',
  activeSport: 'Cycling',
  weightKg: 60,
  restingHeartRate: 50,
  maxHeartRate: 190,
  ftpWatts: 250,
};

describe('AthleteHeaderBanner', () => {
  it('renders title and active sport', async () => {
    await render(
      <AthleteHeaderBanner profile={profile} status="success" onPressSync={jest.fn()} onPressAvatar={jest.fn()} />,
    );
    expect(screen.getByText('ENDURANCE TELEMETRY')).toBeTruthy();
    expect(screen.getByText('Cycling')).toBeTruthy();
  });

  it('handles null profile', async () => {
    await render(
      <AthleteHeaderBanner profile={null} status="empty" onPressSync={jest.fn()} onPressAvatar={jest.fn()} />,
    );
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('fires callbacks', async () => {
    const onPressSync = jest.fn();
    const onPressAvatar = jest.fn();
    await render(
      <AthleteHeaderBanner profile={profile} status="success" onPressSync={onPressSync} onPressAvatar={onPressAvatar} />,
    );
    await fireEvent.press(screen.getByTestId('sync-button'));
    await fireEvent.press(screen.getByTestId('athlete-avatar'));
    expect(onPressSync).toHaveBeenCalledTimes(1);
    expect(onPressAvatar).toHaveBeenCalledTimes(1);
  });
});
