import { fireEvent, render, screen } from '@testing-library/react-native';
import { RoutinesScreen } from './index';
import { useRoutineExecution } from '../../hooks/useRoutineExecution';
import type { RoutineExecution } from '../../hooks/useRoutineExecution';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));
jest.mock('../../hooks/useRoutineExecution');

const mockedHook = useRoutineExecution as jest.MockedFunction<typeof useRoutineExecution>;

const item = { id: 's1', stepNumber: 1, title: 'Warm up', description: 'Easy', targetZone: 'Z2', isDone: false };
const base: RoutineExecution = {
  timelineSteps: [{ id: 'p1', label: 'Warm', state: 'active' }],
  cardItems: [item],
  status: 'success',
  activeStep: item,
  onCompleteStep: jest.fn().mockResolvedValue(undefined),
  onAdvancePhase: jest.fn().mockResolvedValue(undefined),
  canAdvance: true,
};

describe('RoutinesScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loading state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'loading' });
    await render(<RoutinesScreen />);
    expect(screen.getByLabelText('Loading routines')).toBeTruthy();
  });

  it('renders error state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'error' });
    await render(<RoutinesScreen />);
    expect(screen.getByText('Could not load routines.')).toBeTruthy();
  });

  it('renders empty state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'empty', cardItems: [] });
    await render(<RoutinesScreen />);
    expect(screen.getByText('No routines yet.')).toBeTruthy();
  });

  it('navigates to ActiveExecution on start', async () => {
    mockedHook.mockReturnValue(base);
    await render(<RoutinesScreen />);
    await fireEvent.press(screen.getByLabelText('Start execution'));
    expect(mockNavigate).toHaveBeenCalledWith('ActiveExecution', { routineId: 'routine-default' });
  });

  it('navigates to WorkoutDetail on card tap', async () => {
    mockedHook.mockReturnValue(base);
    await render(<RoutinesScreen />);
    await fireEvent.press(screen.getByTestId('routine-card-s1'));
    expect(mockNavigate).toHaveBeenCalledWith('WorkoutDetail', { routineId: 'routine-default', stepId: 's1' });
  });
});
