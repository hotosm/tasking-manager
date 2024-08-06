import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { ReduxIntlProviders, createComponentWithMemoryRouter } from '../../../utils/testWithIntl';
import { NotificationResults, NotificationResultsMini } from '../notificationResults';
import { notifications } from '../../../network/tests/mockData/notifications';
import messages from '../messages';

describe('Mini Notification Results', () => {
  it('should display the refresh button', async () => {
    const retryFnMock = jest.fn();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <NotificationResultsMini notifications={notifications} retryFn={retryFnMock} />
      </ReduxIntlProviders>,
    );
    const refreshBtn = screen.getByRole('button', {
      name: /refresh/i,
    });
    await user.click(refreshBtn);
    expect(retryFnMock).toHaveBeenCalledTimes(1);
  });

  it('should display no notifications found message', () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <NotificationResultsMini notifications={{ userMessages: [] }} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.noUnreadMessages.defaultMessage)).toBeInTheDocument();
  });
});

describe('Notifications Results', () => {
  it('should display error message for fetching notifications', () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <NotificationResults notifications={notifications} isError inboxQuery={{}} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.errorLoadingNotifications.defaultMessage)).toBeInTheDocument();
  });

  it('should fetch for notifications on clicking the try again button', async () => {
    const retryFnMock = jest.fn();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <NotificationResults
          notifications={notifications}
          isError
          inboxQuery={{}}
          retryFn={retryFnMock}
        />
      </ReduxIntlProviders>,
    );
    const retryBtn = screen.getByRole('button', {
      name: /try again/i,
    });
    await user.click(retryBtn);
    expect(retryFnMock).toHaveBeenCalledTimes(1);
  });

  it('should display no notifications found message', () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <NotificationResults notifications={{ userMessages: [] }} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.noMessages.defaultMessage)).toBeInTheDocument();
  });

  it('should display select all notifications button', async () => {
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <NotificationResults notifications={notifications} inboxQuery={{}} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(
      screen.getByRole('button', {
        name: /Select all 208 notifications/i,
      }),
    ).toBeInTheDocument();
  });
});
