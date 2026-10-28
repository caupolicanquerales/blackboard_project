import { render, screen } from '@testing-library/react-native';
import { AppointmentStatusTimeline } from './index';

describe('AppointmentStatusTimeline', () => {
  it('renders all seven steps', async () => {
    await render(<AppointmentStatusTimeline status="SCHEDULED" />);
    expect(screen.getByText('Pending triage')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getAllByTestId(/timeline-node-/)).toHaveLength(7);
    expect(screen.getAllByTestId(/timeline-connector-/)).toHaveLength(6);
  });

  it('marks completed, current and upcoming steps', async () => {
    await render(<AppointmentStatusTimeline status="CONFIRMED" />);
    expect(screen.getByLabelText('Pending triage, completed')).toBeTruthy();
    expect(screen.getByLabelText('Confirmed, current')).toBeTruthy();
    expect(screen.getByLabelText('Completed, upcoming')).toBeTruthy();
  });

  it('treats the first status as current with none completed', async () => {
    await render(<AppointmentStatusTimeline status="PENDING_TRIAGE" />);
    expect(screen.getByLabelText('Pending triage, current')).toBeTruthy();
    expect(screen.queryByText('✓')).toBeNull();
  });
});
