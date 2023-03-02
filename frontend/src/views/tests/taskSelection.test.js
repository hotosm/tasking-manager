import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { store } from '../../store';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { SelectTask } from '../taskSelection';

describe('Task Selection Page', () => {
  store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
  store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
  const setup = () =>
    render(
      <MemoryRouter initialEntries={['/projects/123/tasks']}>
        <Routes>
          <Route
            path="projects/:id/tasks"
            element={
              <QueryParamProvider adapter={ReactRouter6Adapter}>
                <ReduxIntlProviders>
                  <SelectTask />
                </ReduxIntlProviders>
              </QueryParamProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('should redirect to login page if the user is not logged in', () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });
    renderWithRouter(
      <ReduxIntlProviders>
        <SelectTask />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('button', {
        name: /log in/i,
      }),
    ).toBeInTheDocument();
  });

  it('should direct user to the instructions tab if user is not an expert', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: false },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    setup();
    expect(await screen.findByText(/Project Specific Mapping Notes/i)).toBeInTheDocument();
    expect(screen.queryByText(/last updated by/i)).not.toBeInTheDocument();
  });

  it('should direct user to the tasks tab if user is an expert and has previous contributions in the project', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: true },
      });
    });

    setup();
    const taskItems = await screen.findAllByText(/last updated by/i);
    expect(taskItems.length).toBe(6);
    expect(screen.queryByText(/Project Specific Mapping Notes/i)).not.toBeInTheDocument();
  });

  it('should change the button text to map selected task when user selects a task', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: true },
      });
    });
    setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    ).toBeInTheDocument();
    // Selecting a task that is available for mapping
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #1 Patrik_B/i,
      }),
    );
    expect(
      screen.queryByRole('button', {
        name: /map a task/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /map selected task/i,
      }),
    ).toBeInTheDocument();
    // Unselecting selected tasks
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #1 Patrik_B/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    ).toBeInTheDocument();
  });

  it('should change the button text to map another task when user selects a task for validation but the user level is not met', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: true },
      });
    });
    setup();
    await screen.findAllByText(/last updated by/i);
    // Selecting a task that is available for validation
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /map another task/i,
      }),
    ).toBeInTheDocument();
  });

  it('should change the button text to validate selected task', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: true, role: 'ADMIN' },
      });
    });
    setup();
    await screen.findAllByText(/last updated by/i);
    // Selecting a single task that is available for validation
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /validate selected task/i,
      }),
    ).toBeInTheDocument();
    // Selecting a single task that is available for validation
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #6 Patrik_B/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /validate 2 selected tasks/i,
      }),
    ).toBeInTheDocument();
    // Unselecting selected tasks one by one
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /validate selected task/i,
      }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #6 Patrik_B/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    ).toBeInTheDocument();
  });

  it('should filter the task list by search query', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: false },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByPlaceholderText(/filter tasks by id or username/i),
      'helnershingthapa',
    );
    expect(
      screen.queryByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    ).not.toBeInTheDocument();
  });
});
