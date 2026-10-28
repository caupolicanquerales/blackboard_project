import { fireEvent, render } from '@testing-library/react-native';
import { RoleSwitcherHeader } from './index';

describe('RoleSwitcherHeader', () => {
  it('renders location, badge and selected segment', async () => {
    const { getByTestId, getByText } = await render(
      <RoleSwitcherHeader activeView="doctor" location="Clinic A" pendingNotificationCount={3} onSwitch={jest.fn()} />,
    );
    expect(getByText('Clinic A')).toBeTruthy();
    expect(getByTestId('notification-badge-count').props.children).toBe(3);
    expect(getByTestId('segment-doctor').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('segment-patient').props.accessibilityState.selected).toBe(false);
  });

  it('calls onSwitch with the pressed view', async () => {
    const onSwitch = jest.fn();
    const { getByLabelText } = await render(
      <RoleSwitcherHeader activeView="patient" location="Clinic A" pendingNotificationCount={0} onSwitch={onSwitch} />,
    );
    await fireEvent.press(getByLabelText('Staff view'));
    expect(onSwitch).toHaveBeenCalledWith('staff');
  });
});
