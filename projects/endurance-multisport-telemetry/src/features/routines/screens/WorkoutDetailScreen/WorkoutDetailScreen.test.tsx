import { fireEvent, render, screen } from '@testing-library/react-native';
import { WorkoutDetailScreen } from './index';
import { useRoutineExecution } from '../../hooks/useRoutineExecution';
import type { RoutineExecution } from '../../hooks/useRoutineExecution';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: { routineId: 'r1', stepId: 's1' } }),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));
jest.mock('../../hooks/useRoutineExecution');

const mockedHook = useRoutineExecution as jest.MockedFunction<typeof useRoutineExecution>;

const item = { id: 's1', stepNumber: 1, title: 'Warm up', description: 'Easy spin', targetZone: 'Z2', isDone: false };
const base: RoutineExecution = {
  timelineSteps: [{ id: 'p1', label: 'Warm', state: 'active' }],
  cardItems: [item],
  status: 'success',
  activeStep: item,
  onCompleteStep: jest.fn().mockResolvedValue(undefined),
  onAdvancePhase: jest.fn().mockResolvedValue(undefined),
  canAdvance: true,
};

describe('WorkoutDetailScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loading state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'loading' });
    await render(<WorkoutDetailScreen />);
    expect(screen.getByLabelText('Loading step')).toBeTruthy();
  });

  it('renders error state and goes back', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'error' });
    await render(<WorkoutDetailScreen />);
    expect(screen.getByText('Could not load the step.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders empty state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'empty', cardItems: [], activeStep: null });
    await render(<WorkoutDetailScreen />);
    expect(screen.getByText('Step not found.')).toBeTruthy();
  });

  it('renders step details and completes it', async () => {
    mockedHook.mockReturnValue(base);
    await render(<WorkoutDetailScreen />);
    expect(screen.getByText('Warm up')).toBeTruthy();
    expect(screen.getByText('Easy spin')).toBeTruthy();
    expect(screen.getByText('Target zone: Z2')).toBeTruthy();
    await fireEvent.press(screen.getByText('Mark complete'));
    expect(base.onCompleteStep).toHaveBeenCalledWith('s1');
  });
});
