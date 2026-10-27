import { render, screen } from '@testing-library/react-native';
import { RadialGaugeIndicator } from './index';

describe('RadialGaugeIndicator', () => {
  it('renders two rings with labels', async () => {
    await render(<RadialGaugeIndicator targetLoadPct={70} intervalPct={40} status="success" />);
    expect(screen.getByTestId('radial-gauge')).toBeTruthy();
    expect(screen.getByText('Target 70%')).toBeTruthy();
    expect(screen.getByText('Interval 40%')).toBeTruthy();
  });

  it('clamps out-of-range values', async () => {
    await render(<RadialGaugeIndicator targetLoadPct={150} intervalPct={-5} status="success" />);
    expect(screen.getByText('Target 100%')).toBeTruthy();
    expect(screen.getByText('Interval 0%')).toBeTruthy();
  });

  it('renders loading, error and empty states', async () => {
    const { rerender } = await render(<RadialGaugeIndicator targetLoadPct={0} intervalPct={0} status="loading" />);
    expect(screen.getByText('Loading gauge...')).toBeTruthy();
    await rerender(<RadialGaugeIndicator targetLoadPct={0} intervalPct={0} status="error" />);
    expect(screen.getByText('Unable to load gauge')).toBeTruthy();
    await rerender(<RadialGaugeIndicator targetLoadPct={0} intervalPct={0} status="empty" />);
    expect(screen.getByText('No gauge data')).toBeTruthy();
  });
});
