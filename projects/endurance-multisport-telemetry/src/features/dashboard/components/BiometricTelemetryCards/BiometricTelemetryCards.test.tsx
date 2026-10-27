import { fireEvent, render, screen } from '@testing-library/react-native';
import { BiometricTelemetryCards } from './index';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));

const metric = {
  id: 'm1',
  heartRate: 150,
  powerOutput: 240,
  cadence: 90,
  trainingLoad: 70,
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('BiometricTelemetryCards', () => {
  it('renders values and fires callbacks', async () => {
    const onPressMetric = jest.fn();
    await render(
      <BiometricTelemetryCards metric={metric} status="success" onPressMetric={onPressMetric} />,
    );
    expect(screen.getByText('150')).toBeTruthy();
    expect(screen.getByText('240')).toBeTruthy();
    expect(screen.getByText('90')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('metric-card-power'));
    expect(onPressMetric).toHaveBeenCalledWith('power');
  });

  it('renders loading, error and empty states', async () => {
    const fn = jest.fn();
    const { rerender } = await render(
      <BiometricTelemetryCards metric={null} status="loading" onPressMetric={fn} />,
    );
    expect(screen.getByText('Loading telemetry...')).toBeTruthy();
    await rerender(<BiometricTelemetryCards metric={null} status="error" onPressMetric={fn} />);
    expect(screen.getByText('Unable to load telemetry')).toBeTruthy();
    await rerender(<BiometricTelemetryCards metric={null} status="empty" onPressMetric={fn} />);
    expect(screen.getByText('No telemetry available')).toBeTruthy();
  });
});
