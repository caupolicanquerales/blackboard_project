import { render, screen } from '@testing-library/react-native';
import { LiveTelemetryStatisticsBar } from './index';

const metric = {
  id: 'm1',
  heartRate: 150,
  powerOutput: 100,
  cadence: 90,
  trainingLoad: 50,
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('LiveTelemetryStatisticsBar', () => {
  it('renders two meters with values', async () => {
    await render(
      <LiveTelemetryStatisticsBar metric={metric} status="success" maxHeartRate={200} maxPower={400} />,
    );
    expect(screen.getByText('Heart rate 150 bpm')).toBeTruthy();
    expect(screen.getByText('Power 100 W')).toBeTruthy();
    expect(screen.getByTestId('hr-meter').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '75%' })]),
    );
    expect(screen.getByTestId('power-meter').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '25%' })]),
    );
  });

  it('renders loading, error and empty states', async () => {
    const { rerender } = await render(
      <LiveTelemetryStatisticsBar metric={null} status="loading" maxHeartRate={200} maxPower={400} />,
    );
    expect(screen.getByText('Loading telemetry...')).toBeTruthy();
    await rerender(
      <LiveTelemetryStatisticsBar metric={null} status="error" maxHeartRate={200} maxPower={400} />,
    );
    expect(screen.getByText('Unable to load telemetry')).toBeTruthy();
    await rerender(
      <LiveTelemetryStatisticsBar metric={null} status="success" maxHeartRate={200} maxPower={400} />,
    );
    expect(screen.getByText('No telemetry available')).toBeTruthy();
  });
});
