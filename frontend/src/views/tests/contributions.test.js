import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { act, screen, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';

import { store } from '../../store';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ContributionsPage, ContributionsPageIndex, UserStats } from '../contributions';

describe('Contributions Page', () => {
  it('should navigate to login page if no user token is present', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    const { router } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ContributionsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() => expect(router.state.location.pathname).toEqual('/login'));
  });

  it('should display contents of the child components', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, username: 'test_user' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ContributionsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    expect(screen.getByRole('heading', { name: /my tasks/i })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByText('#8629')).toBeInTheDocument();
    expect(await screen.findByText('Task #1822 · Project #5871')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: '1',
      }),
    ).toBeInTheDocument();
  });
});

describe('Contributions Page Index', () => {
  it('should render header profile', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, username: 'test_user' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <ReduxIntlProviders>
        <ContributionsPageIndex />
      </ReduxIntlProviders>,
    );
    expect(screen.getAllByRole('link', { name: 'test_user' }).length).toBe(4);
  });
});

describe('User Stats Page', () => {
  it('should render the child component', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <UserStats />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('heading', { name: 'Contribution Timeline' })).toBeInTheDocument();
  });
});
