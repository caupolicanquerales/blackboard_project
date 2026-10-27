import { fireEvent, render, screen } from '@testing-library/react-native';
import { HorizontalStepperTimeline } from './index';
import type { TimelineStep } from '../../models/timeline-step';

const steps: TimelineStep[] = [
  { id: 'a', label: 'Warmup', state: 'done' },
  { id: 'b', label: 'Swim', state: 'active' },
  { id: 'c', label: 'Bike', state: 'pending' },
  { id: 'd', label: 'Run', state: 'pending' },
];

describe('HorizontalStepperTimeline', () => {
  it('renders four numbered steps', async () => {
    await render(<HorizontalStepperTimeline steps={steps} onPressStep={jest.fn()} />);
    expect(screen.getByText('STEP 01')).toBeTruthy();
    expect(screen.getByText('STEP 04')).toBeTruthy();
    expect(screen.getByText('Swim')).toBeTruthy();
  });

  it('calls onPressStep with the step id', async () => {
    const onPressStep = jest.fn();
    await render(<HorizontalStepperTimeline steps={steps} onPressStep={onPressStep} />);
    await fireEvent.press(screen.getByText('Bike'));
    expect(onPressStep).toHaveBeenCalledWith('c');
  });
});
