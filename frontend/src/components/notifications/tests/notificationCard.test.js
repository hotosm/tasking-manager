import '@testing-library/jest-dom';
import { screen, waitFor, render } from '@testing-library/react';

import { MessageAvatar, NotificationCard, NotificationCardMini } from '../notificationCard';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { notifications } from '../../../network/tests/mockData/notifications';
import { setupFaultyHandlers } from '../../../network/tests/server';

describe('Message Avatar', () => {
  it('should return nothing username and message type is undefined', () => {
    const { container } = render(<MessageAvatar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should return system generated display picture if username is not passed', () => {
    render(<MessageAvatar messageType="SYSTEM" />);
    expect(screen.getByTitle('System')).toBeInTheDocument();
  });
});

describe('Notification Card', () => {
  const fetchNotificationsMock = jest.fn();
  it('should mark the notification as read', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCard
          {...notifications.userMessages[0]}
          selected={[]}
          retryFn={fetchNotificationsMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /Mark notification as read/i,
      }),
    );
    await waitFor(() => expect(fetchNotificationsMock).toHaveBeenCalledTimes(1));
  });

  it('should delete the notification', async () => {
    const setSelectedMock = jest.fn();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCard
          {...notifications.userMessages[0]}
          selected={[1, 2, 3]}
          setSelected={setSelectedMock}
          retryFn={fetchNotificationsMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getAllByRole('button')[1]);
    await waitFor(() => {
      expect(fetchNotificationsMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should catch error on deletion error', async () => {
    setupFaultyHandlers();
    const setSelectedMock = jest.fn();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCard
          {...notifications.userMessages[0]}
          selected={[1, 2, 3]}
          setSelected={setSelectedMock}
          retryFn={fetchNotificationsMock}
        />
      </ReduxIntlProviders>,
    );

    await user.click(screen.getAllByRole('button')[1]);
    // Error is then consoled
    expect(fetchNotificationsMock).not.toHaveBeenCalled();
  });

  it('should open any links in the notification message', async () => {
    global.open = jest.fn();
    const setSelectedMock = jest.fn();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCard
          {...notifications.userMessages[0]}
          selected={[1, 2, 3]}
          setSelected={setSelectedMock}
          retryFn={fetchNotificationsMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('link', {
        name: 'Sample Team',
      }),
    );
    expect(global.open).toHaveBeenCalledWith('https://tasks-stage.hotosm.org/manage/teams/19/');
  });

  it('should open notification modal', async () => {
    global.open = jest.fn();
    const setSelectedMock = jest.fn();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCard
          {...notifications.userMessages[0]}
          selected={[1, 2, 3]}
          setSelected={setSelectedMock}
          retryFn={fetchNotificationsMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByText(/sample subject/i));
    // Awaiting portion of the notification message inside the dialog
    await waitFor(() => expect(screen.getByText(/Sample message/i)).toBeInTheDocument());
  });
});

describe('Notification Card Mini', () => {
  it('should refetch notifications on closing the dialog', async () => {
    const fetchNotificationsMock = jest.fn();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCardMini {...notifications.userMessages[0]} retryFn={fetchNotificationsMock} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByRole('article'));
    await waitFor(() => expect(screen.getByText(/Sample message/i)).toBeInTheDocument());
    await user.click(
      screen.getByRole('button', {
        name: /close/i,
      }),
    );
    expect(fetchNotificationsMock).toHaveBeenCalledTimes(1);
  });
});
