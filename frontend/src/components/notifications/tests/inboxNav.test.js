import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import userEvent from '@testing-library/user-event';

import { InboxNav, InboxNavMini, InboxNavMiniBottom } from '../inboxNav';
import {
  IntlProviders,
  ReduxIntlProviders,
  createComponentWithMemoryRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';

describe('Inbox Nav', () => {
  it('should display styles for active tab and clear filters button', () => {
    createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <IntlProviders>
          <InboxNav />
        </IntlProviders>
      </QueryParamProvider>,
      {
        route: '/notifications',
        entryRoute: '/notifications?orderBy=date&orderByType=desc&page=1&pageSize=10&types=3,1,6,7',
      },
    );

    // Messages is the active tab being targeted from the entry route types params
    expect(
      screen.getByRole('link', {
        name: /messages/i,
      }),
    ).toHaveClass('bg-blue-light grey-light white');
    expect(
      screen.getByRole('link', {
        name: /projects/i,
      }),
    ).not.toHaveClass('bg-blue-light grey-light white');
    expect(
      screen.getByRole('link', {
        name: /clear filters/i,
      }),
    ).toBeInTheDocument();
  });

  it('should set the popout focus of notification popover to false on navigating to the notifications page', async () => {
    const setPopoutFocusMock = jest.fn();
    createComponentWithMemoryRouter(
      <IntlProviders>
        <InboxNavMiniBottom setPopoutFocus={setPopoutFocusMock} />
      </IntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('link', {
        name: /go to notifications/i,
      }),
    );
    expect(setPopoutFocusMock).toHaveBeenCalledTimes(1);
    expect(setPopoutFocusMock).toHaveBeenCalledWith(false);
  });

  it("should show '1 new notification' text for single message", () => {
    act(() => {
      store.dispatch({ type: 'SET_UNREAD_COUNT', payload: 1 });
    });
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <InboxNavMini />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('link', {
        name: /1 unread notification/i,
      }),
    ).toBeInTheDocument();
  });
});
