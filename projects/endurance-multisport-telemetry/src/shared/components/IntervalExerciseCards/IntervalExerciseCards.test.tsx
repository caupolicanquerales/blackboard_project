import { fireEvent, render, screen } from '@testing-library/react-native';
import { IntervalExerciseCards } from './index';

const items = [
  { id: 'a', stepNumber: 1, title: 'Warmup', description: 'Easy', targetZone: 'Z1', isDone: false },
  { id: 'b', stepNumber: 2, title: 'Sprint', description: 'Hard', targetZone: 'Z5', isDone: true },
];

describe('IntervalExerciseCards', () => {
  it('renders cards and fires onComplete for pending ones', async () => {
    const onComplete = jest.fn();
    await render(<IntervalExerciseCards items={items} status="success" onComplete={onComplete} />);
    expect(screen.getByText('Warmup')).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('interval-complete-a'));
    expect(onComplete).toHaveBeenCalledWith('a');
  });

  it('does not complete done steps', async () => {
    const onComplete = jest.fn();
    await render(<IntervalExerciseCards items={items} status="success" onComplete={onComplete} />);
    await fireEvent.press(screen.getByTestId('interval-complete-b'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('renders status states', async () => {
    await render(<IntervalExerciseCards items={[]} status="loading" onComplete={jest.fn()} />);
    expect(screen.getByTestId('interval-cards-loading')).toBeTruthy();
  });
});
