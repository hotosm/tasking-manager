import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';

import { TaskSelection } from '..';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { taskAssignments } from '../../../network/tests/mockData/taskAssignments';
import { server } from '../../../network/tests/server';
import { QueryClientProviders, ReduxIntlProviders } from '../../../utils/testWithIntl';
import { API_URL } from '../../../config';
import { store } from '../../../store';

const setup = (project, route = '/projects/123/tasks') => ({
  user: userEvent.setup(),
  ...render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="projects/:id/:tabname"
          element={
            <QueryClientProviders>
              <QueryParamProvider adapter={ReactRouter6Adapter}>
                <ReduxIntlProviders>
                  <TaskSelection project={project} />
                </ReduxIntlProviders>
              </QueryParamProvider>
            </QueryClientProviders>
          }
        />
      </Routes>
    </MemoryRouter>,
  ),
});

const login = (userDetails) =>
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
    store.dispatch({ type: 'SET_USER_DETAILS', userDetails });
  });

const mapper = { id: 420, username: 'somebodyWhoHasntContributed', role: 'MAPPER' };

describe('Task selection with assignments', () => {
  beforeEach(() => {
    server.use(
      rest.get(API_URL + 'projects/:id/tasks/queries/assignments/', (req, res, ctx) =>
        res(ctx.json(taskAssignments)),
      ),
    );
  });

  it('warns but allows mapping a task assigned to someone else in soft mode', async () => {
    login(mapper);
    setup(getProjectSummary(123), '/projects/123/tasks?search=2');
    expect(
      await screen.findByText(
        /This task is assigned to another_mapper\. You can still work on it/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map selected task/i })).toBeEnabled();
  });

  it('blocks mapping a task assigned to someone else when assignment is enforced', async () => {
    login(mapper);
    setup(
      { ...getProjectSummary(123), enforceTaskAssignment: true },
      '/projects/123/tasks?search=2',
    );
    expect(
      await screen.findByText(/In this project only the assignee can work on assigned tasks/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map selected task/i })).toBeDisabled();
  });

  it('does not warn for a task assigned to the user', async () => {
    login(mapper);
    setup(
      { ...getProjectSummary(123), enforceTaskAssignment: true },
      '/projects/123/tasks?search=1',
    );
    expect(await screen.findByRole('button', { name: /map selected task/i })).toBeEnabled();
    expect(screen.queryByText(/assigned to another_mapper/i)).not.toBeInTheDocument();
  });

  it('does not block project managers when assignment is enforced', async () => {
    login({ ...mapper, role: 'ADMIN' });
    setup(
      { ...getProjectSummary(123), enforceTaskAssignment: true },
      '/projects/123/tasks?search=2',
    );
    expect(await screen.findByText(/You can still work on it/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map selected task/i })).toBeEnabled();
  });

  it('hides the assign mode from users who cannot manage the project', async () => {
    login(mapper);
    setup(getProjectSummary(123));
    await screen.findByRole('button', { name: /map a task|map selected task/i });
    expect(screen.queryByRole('button', { name: 'Assign tasks' })).not.toBeInTheDocument();
  });

  it('lets project managers select tasks and open the assign dialog', async () => {
    login({ ...mapper, role: 'ADMIN' });
    const { user } = setup(getProjectSummary(123));
    await user.click(await screen.findByRole('button', { name: 'Assign tasks' }));
    expect(await screen.findByText('0 tasks selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /select unassigned tasks/i }));
    // the footer switches to the assignment actions for the selection
    const assignButton = await screen.findByRole('button', { name: /^Assign \d+ tasks$/ });
    expect(assignButton).toBeEnabled();
    await user.click(assignButton);
    expect(await screen.findByRole('tab', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mapping' })).toBeChecked();

    // leaving the assign mode restores the mapping footer
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: /done assigning/i }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^Assign \d+ tasks$/ })).not.toBeInTheDocument(),
    );
  });
});
