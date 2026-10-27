import { render, screen } from '@testing-library/react-native';
import { ComparisonSplitBars } from './index';

const ratios = [
  { id: 'a', primaryPercentage: 30, secondaryPercentage: 70, categoryLabel: 'Planned' },
  { id: 'b', primaryPercentage: 50, secondaryPercentage: 50, categoryLabel: 'Actual' },
];

describe('ComparisonSplitBars', () => {
  it('renders two split bars with values', async () => {
    await render(<ComparisonSplitBars ratios={ratios} status="success" />);
    expect(screen.getByText('30/70')).toBeTruthy();
    expect(screen.getByText('50/50')).toBeTruthy();
    expect(screen.getByText('Planned')).toBeTruthy();
    expect(screen.getByTestId('split-bar-b')).toBeTruthy();
  });

  it('renders loading, error and empty states', async () => {
    const { rerender } = await render(<ComparisonSplitBars ratios={[]} status="loading" />);
    expect(screen.getByText('Loading ratios...')).toBeTruthy();
    await rerender(<ComparisonSplitBars ratios={[]} status="error" />);
    expect(screen.getByText('Unable to load ratios')).toBeTruthy();
    await rerender(<ComparisonSplitBars ratios={[]} status="empty" />);
    expect(screen.getByText('No ratios available')).toBeTruthy();
  });
});
