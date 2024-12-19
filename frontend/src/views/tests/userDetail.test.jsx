import '@testing-library/jest-dom';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { UserDetail } from '../userDetail';
import { store } from '../../store';
import {
  createComponentWithMemoryRouter,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';

describe('User Detail Component', () => {
  jest.mock('react-chartjs-2', () => ({
    Doughnut: () => null,
  }));

  it('should redirect to login page if no user token is present', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    const { router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <UserDetail username="test_user" />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('should render details for the child components', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'user123' },
      });
    });

    render(
      <MemoryRouter initialEntries={['/users/:friendUsername']}>
        <Routes>
          <Route
            path="users/:username"
            element={
              <QueryClientProviders>
                <ReduxIntlProviders>
                  <UserDetail />
                </ReduxIntlProviders>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Somebody')).toBeInTheDocument();
    expect(screen.getByText(/time spent mapping/i)).toBeInTheDocument();
    expect(await screen.findByTitle('American Red Cross')).toBeInTheDocument();
    expect(await screen.findByText('Philippines')).toBeInTheDocument();
    expect(await screen.findByText('Team Test')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /contribution timeline/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', {
        name: /projects/i,
      })[0],
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /tessttt/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /tasks/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Countries',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /teams/i,
      }),
    ).toBeInTheDocument();
  });

  it('should not display teams section when viewing own profile', () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'somebodyUsername' },
      });
    });

    renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <UserDetail username="somebodyUsername" />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    expect(
      screen.queryByRole('heading', {
        name: /teams/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('should not display header when the prop is falsy', () => {
    renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <UserDetail username="somebodyUsername" withHeader={false} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(screen.queryByText('Somebody')).not.toBeInTheDocument();
  });
});
