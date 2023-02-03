import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { act, screen, render, waitFor } from '@testing-library/react';
import { ReachAdapter } from 'use-query-params/adapters/reach';
import { QueryParamProvider } from 'use-query-params';

import { store } from '../../store';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { ContributionsPage, ContributionsPageIndex, UserStats } from '../contributions';

describe('Contributions Page', () => {
  it('should navigate to login page if no user token is present', async () => {
    // The navigate function is passed as a prop from the root file
    // so creating a mock function to simulate the navigation to login page
    const navigateMock = jest.fn();
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <ContributionsPage navigate={navigateMock} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
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
      <QueryParamProvider adapter={ReachAdapter}>
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
  it('should render child component and props children', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, username: 'test_user' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    render(
      <ReduxIntlProviders>
        <ContributionsPageIndex>Hello world</ContributionsPageIndex>
      </ReduxIntlProviders>,
    );
    expect(screen.getAllByRole('link', { name: 'test_user' }).length).toBe(4);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
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
