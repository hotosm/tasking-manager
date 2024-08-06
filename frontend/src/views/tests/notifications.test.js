import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';

import {
  QueryClientProviders,
  ReduxIntlProviders,
  createComponentWithMemoryRouter,
} from '../../utils/testWithIntl';
import { NotificationsPage } from '../notifications';
import { store } from '../../store';

describe('Notifications Page', () => {
  it('should navigate to the login page if the user is not logged in', () => {
    const { router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <NotificationsPage />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );
    expect(router.state.location.pathname).toBe('/login');
  });

  it('should display notifications if the user is logged in', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <NotificationsPage />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() => expect(screen.getAllByText('Team announcement')[0]).toBeInTheDocument());
    expect(screen.getAllByRole('article').length).toBe(10);
  });
});
