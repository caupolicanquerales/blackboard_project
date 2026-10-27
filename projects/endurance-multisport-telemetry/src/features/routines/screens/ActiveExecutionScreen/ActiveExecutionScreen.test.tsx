import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActiveExecutionScreen } from './index';
import { useRoutineExecution } from '../../hooks/useRoutineExecution';
import type { RoutineExecution } from '../../hooks/useRoutineExecution';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { routineId: 'r1' } }),
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

describe('ActiveExecutionScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loading state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'loading' });
    await render(<ActiveExecutionScreen />);
    expect(screen.getByLabelText('Loading routine')).toBeTruthy();
  });

  it('renders error state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'error' });
    await render(<ActiveExecutionScreen />);
    expect(screen.getByText('Could not load the routine.')).toBeTruthy();
  });

  it('renders empty state', async () => {
    mockedHook.mockReturnValue({ ...base, status: 'empty', cardItems: [], activeStep: null });
    await render(<ActiveExecutionScreen />);
    expect(screen.getByText('No steps in this routine.')).toBeTruthy();
  });

  it('completes the active step from the action bar', async () => {
    mockedHook.mockReturnValue(base);
    await render(<ActiveExecutionScreen />);
    await fireEvent.press(screen.getByText('Complete step'));
    expect(base.onCompleteStep).toHaveBeenCalledWith('s1');
  });
});
