import { render, screen } from '@testing-library/react-native';
import { PriorityTriageBadge } from './index';

describe('PriorityTriageBadge', () => {
  it('shows rank and score', async () => {
    await render(<PriorityTriageBadge severity="URGENT" score={9} />);
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('announces rank and score', async () => {
    await render(<PriorityTriageBadge severity="HIGH" score={7} />);
    expect(screen.getByLabelText('Priority High, score 7 out of 10')).toBeTruthy();
  });

  it('clamps score to 0-10', async () => {
    await render(<PriorityTriageBadge severity="ROUTINE" score={15} />);
    expect(screen.getByText('10')).toBeTruthy();
  });
});
