import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileScreen } from './index';
import { useAthleteProfileStore } from '../../../../core/store/athlete-profile.store';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ canGoBack: () => false, popToTop: jest.fn() }),
}));

const profile = {
  id: '1',
  displayName: 'Ana',
  role: 'ATHLETE' as const,
  avatarUri: 'https://example.com/a.png',
  activeSport: 'Cycling',
  weightKg: 60,
  restingHeartRate: 50,
  maxHeartRate: 190,
  ftpWatts: 250,
};

describe('ProfileScreen', () => {
  const loadProfile = jest.fn();

  beforeEach(() => {
    loadProfile.mockReset();
  });

  it('renders loading state', async () => {
    useAthleteProfileStore.setState({ profile: null, status: 'loading', loadProfile });
    await render(<ProfileScreen />);
    expect(screen.getByLabelText('Loading profile')).toBeTruthy();
  });

  it('renders error state with retry', async () => {
    useAthleteProfileStore.setState({ profile: null, status: 'error', error: 'Boom', loadProfile });
    await render(<ProfileScreen />);
    expect(screen.getByText('Boom')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Retry loading profile'));
    expect(loadProfile).toHaveBeenCalled();
  });

  it('renders profile metrics and signs out', async () => {
    useAthleteProfileStore.setState({ profile, status: 'success', error: undefined, loadProfile });
    await render(<ProfileScreen />);
    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('250 W')).toBeTruthy();
    expect(screen.getByText('190 bpm')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Sign out'));
    expect(useAthleteProfileStore.getState().profile).toBeNull();
  });
});
