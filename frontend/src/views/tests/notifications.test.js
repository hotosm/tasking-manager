import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';

import { ReduxIntlProviders, createComponentWithMemoryRouter } from '../../utils/testWithIntl';
import { NotificationsPage } from '../notifications';
import { store } from '../../store';

describe('Notifications Page', () => {
  it('should navigate to the login page if the user is not logged in', () => {
    const { router } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <NotificationsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    expect(router.state.location.pathname).toBe('/login');
  });

  it('should display notifications if the user is logged in', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <NotificationsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() => expect(screen.getAllByText('Team announcement')[0]).toBeInTheDocument());
    expect(screen.getAllByRole('article').length).toBe(10);
  });
});
