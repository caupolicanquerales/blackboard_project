import { fireEvent, render, screen } from '@testing-library/react-native';
import { ToastBannerHost } from './index';
import type { ToastNotification } from '../../core/models/notification';

const make = (id: string, message: string): ToastNotification => ({
  id,
  message,
  severity: 'info',
  createdAt: '2024-01-01T00:00:00Z',
  timeoutMs: 3000,
});

describe('ToastBannerHost', () => {
  it('renders nothing when queue is empty', async () => {
    await render(<ToastBannerHost notifications={[]} onDismiss={jest.fn()} />);
    expect(screen.queryByTestId('toast-banner')).toBeNull();
  });

  it('shows only the head of the queue', async () => {
    await render(<ToastBannerHost notifications={[make('a', 'First'), make('b', 'Second')]} onDismiss={jest.fn()} />);
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.queryByText('Second')).toBeNull();
  });

  it('calls onDismiss with the head id', async () => {
    const onDismiss = jest.fn();
    await render(<ToastBannerHost notifications={[make('a', 'First')]} onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByTestId('toast-dismiss'));
    expect(onDismiss).toHaveBeenCalledWith('a');
  });
});
