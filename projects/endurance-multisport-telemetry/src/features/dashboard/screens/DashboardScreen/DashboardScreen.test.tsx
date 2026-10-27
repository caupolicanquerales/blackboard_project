import { fireEvent, render, screen } from '@testing-library/react-native';
import { DashboardScreen } from './index';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { DashboardData } from '../../hooks/useDashboardData';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));
jest.mock('../../hooks/useDashboardData');

const mockedHook = useDashboardData as jest.MockedFunction<typeof useDashboardData>;

const base: DashboardData = {
  metric: { id: 'm1', heartRate: 150, powerOutput: 240, cadence: 90, trainingLoad: 70, updatedAt: '2026-01-01T00:00:00Z' },
  ratios: [],
  steps: [],
  phases: [],
  gauges: { targetLoadPct: 70, intervalPct: 40 },
  status: 'success',
  refreshing: false,
  onRefresh: jest.fn().mockResolvedValue(undefined),
  onReset: jest.fn().mockResolvedValue(undefined),
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders loading state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'loading', metric: null });
    await render(<DashboardScreen />);
    expect(screen.getByLabelText('Loading dashboard')).toBeTruthy();
  });

  it('renders error state with retry', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    mockedHook.mockReturnValue({ ...base, status: 'error', metric: null, onRefresh });
    await render(<DashboardScreen />);
    await fireEvent.press(screen.getByLabelText('Retry loading dashboard'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders empty state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'empty', metric: null });
    await render(<DashboardScreen />);
    expect(screen.getByText('No telemetry available')).toBeTruthy();
  });

  it('renders success and navigates on primary action', async () => {
    mockedHook.mockReturnValue(base);
    await render(<DashboardScreen />);
    expect(screen.getByText('150')).toBeTruthy();
    await fireEvent.press(screen.getByText('Start routine'));
    expect(mockNavigate).toHaveBeenCalledWith('Routines');
  });
});
