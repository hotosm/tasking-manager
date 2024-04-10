import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { store } from '../../store';
import { QueryClientProviders, ReduxIntlProviders } from '../../utils/testWithIntl';
import { SelectTask } from '../taskSelection';

describe('Task Selection Page', () => {
  const setup = () => {
    return {
      user: userEvent.setup(),
      ...render(
        <MemoryRouter initialEntries={['/projects/123/tasks']}>
          <Routes>
            <Route
              path="projects/:id/tasks"
              element={
                <QueryClientProviders>
                  <QueryParamProvider adapter={ReactRouter6Adapter}>
                    <ReduxIntlProviders>
                      <SelectTask />
                    </ReduxIntlProviders>
                  </QueryParamProvider>
                </QueryClientProviders>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      ),
    };
  };

  it('should redirect to login page if the user is not logged in', () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    });
    setup();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should display message hinting users that they are not ready to work on the project', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: false, role: 'READ_ONLY' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    setup();

    expect(await screen.findByText(/Project Specific Mapping Notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /you are not ready to work on this project/i,
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
    const { user } = setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    ).toBeInTheDocument();
    // Selecting a task that is available for mapping
    await user.click(
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
    await user.click(
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
    const { user } = setup();
    await screen.findAllByText(/last updated by/i);
    // Selecting a task that is available for validation
    await user.click(
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
    const { user } = setup();
    await screen.findAllByText(/last updated by/i);
    // Selecting a single task that is available for validation
    await user.click(
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
    await user.click(
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
    await user.click(
      screen.getByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /validate selected task/i,
      }),
    ).toBeInTheDocument();
    await user.click(
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
    const { user } = setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(/filter tasks by id or username/i),
      'helnershingthapa',
    );
    expect(
      screen.queryByRole('button', {
        name: /Task #5 Aadesh Baral/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('should navigate to the contributions tab', async () => {
    const { user } = setup();
    await screen.findAllByText(/last updated by/i);
    await user.click(
      screen.getByRole('button', {
        name: /contributions/i,
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /statistics/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('Random Task Selection', () => {
  const setup = () => {
    return {
      user: userEvent.setup(),
      ...render(
        <MemoryRouter initialEntries={['/projects/963/tasks']}>
          <Routes>
            <Route
              path="projects/:id/tasks"
              element={
                <QueryClientProviders>
                  <QueryParamProvider adapter={ReactRouter6Adapter}>
                    <ReduxIntlProviders>
                      <SelectTask />
                    </ReduxIntlProviders>
                  </QueryParamProvider>
                </QueryClientProviders>
              }
            />
          </Routes>
        </MemoryRouter>,
      ),
    };
  };

  it('should not change the button text to map selected task when user selects a task for mapping', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: true },
      });
    });
    const { user } = setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    ).toBeInTheDocument();
    // Selecting a task that is available for mapping
    await user.click(
      screen.getByRole('button', {
        name: /Task #1 Patrik_B/i,
      }),
    );
    expect(
      screen.queryByRole('button', {
        name: /map selected task/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('should display text clue that random task selection has been enforced', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: false },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    setup();
    expect(await screen.findByText(/Project Specific Mapping Notes/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This project has enforced random task selection for mapping/i),
    ).toBeInTheDocument();
  });
});

describe('Complete Project', () => {
  const setup = () =>
    render(
      <MemoryRouter initialEntries={['/projects/6/tasks']}>
        <Routes>
          <Route
            path="projects/:id/tasks"
            element={
              <QueryClientProviders>
                <QueryParamProvider adapter={ReactRouter6Adapter}>
                  <ReduxIntlProviders>
                    <SelectTask />
                  </ReduxIntlProviders>
                </QueryParamProvider>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('should display button to select another project', async () => {
    setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /select another project/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('Mapped Project', () => {
  const setup = () =>
    render(
      <MemoryRouter initialEntries={['/projects/3/tasks']}>
        <Routes>
          <Route
            path="projects/:id/tasks"
            element={
              <QueryClientProviders>
                <QueryParamProvider adapter={ReactRouter6Adapter}>
                  <ReduxIntlProviders>
                    <SelectTask />
                  </ReduxIntlProviders>
                </QueryParamProvider>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('should display button to validate a task', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'user_3', isExpert: false, role: 'ADMIN' },
      });
    });
    setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /validate a task/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('Resume Mapping', () => {
  const setup = () =>
    render(
      <MemoryRouter initialEntries={['/projects/222/tasks']}>
        <Routes>
          <Route
            path="projects/:id/tasks"
            element={
              <QueryClientProviders>
                <QueryParamProvider adapter={ReactRouter6Adapter}>
                  <ReduxIntlProviders>
                    <SelectTask />
                  </ReduxIntlProviders>
                </QueryParamProvider>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('should display button to resume mapping', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 69, username: 'Patrik_B', isExpert: false, role: 'ADMIN' },
      });
    });
    setup();
    await screen.findAllByText(/last updated by/i);
    expect(
      screen.getByRole('button', {
        name: /resume mapping/i,
      }),
    ).toBeInTheDocument();
  });
});

test('it should pre select task from the list from URL params', async () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { id: 69, username: 'user_3', isExpert: true },
    });
  });

  render(
    <MemoryRouter initialEntries={['/projects/123/tasks?search=1']}>
      <Routes>
        <Route
          path="projects/:id/tasks"
          element={
            <QueryClientProviders>
              <QueryParamProvider adapter={ReactRouter6Adapter}>
                <ReduxIntlProviders>
                  <SelectTask />
                </ReduxIntlProviders>
              </QueryParamProvider>
            </QueryClientProviders>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findAllByText(/last updated by/i);
  expect(screen.getByPlaceholderText(/filter tasks by id or username/i)).toHaveValue('1');
  expect(
    screen.getByRole('button', {
      name: /map selected task/i,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: /Task #1 Patrik_B/i,
    }).parentElement,
  ).toHaveClass('ba b--blue-dark bw1');
});
