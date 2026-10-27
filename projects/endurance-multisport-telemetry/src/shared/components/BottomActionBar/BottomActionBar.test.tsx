import { fireEvent, render, screen } from '@testing-library/react-native';
import { BottomActionBar } from './index';

describe('BottomActionBar', () => {
  it('renders labels and fires callbacks', async () => {
    const onPrimary = jest.fn();
    const onPress = jest.fn();
    await render(
      <BottomActionBar
        primaryLabel="Start"
        onPrimary={onPrimary}
        secondaryActions={[{ id: 'a', label: 'Lap', onPress }]}
      />,
    );
    await fireEvent.press(screen.getByText('Start'));
    await fireEvent.press(screen.getByText('Lap'));
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire disabled actions', async () => {
    const onPrimary = jest.fn();
    const onPress = jest.fn();
    await render(
      <BottomActionBar
        primaryLabel="Start"
        onPrimary={onPrimary}
        primaryDisabled
        secondaryActions={[{ id: 'a', label: 'Lap', onPress, disabled: true }]}
      />,
    );
    await fireEvent.press(screen.getByText('Start'));
    await fireEvent.press(screen.getByText('Lap'));
    expect(onPrimary).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
