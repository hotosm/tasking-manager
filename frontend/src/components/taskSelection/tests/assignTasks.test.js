import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { rest } from 'msw';

import { AssignModeFooter, AssignTasksModal, UnassignTasksModal } from '../assignTasks';
import TaskSelectionFooter, { AssignmentConflictAlert } from '../footer';
import { TaskAssignees, TaskFilter, TaskList } from '../taskList';
import { server } from '../../../network/tests/server';
import {
  assignTasksWithWarnings,
  taskAssignments,
} from '../../../network/tests/mockData/taskAssignments';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';
import { groupAssignmentsByTask, mergeAssignmentsIntoTasks } from '../../../utils/taskAssignments';
import {
  IntlProviders,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { API_URL } from '../../../config';
import { store } from '../../../store';

const userAssignment = taskAssignments.assignments[1]; // task 2, another_mapper
const teamAssignment = taskAssignments.assignments[2]; // task 3, Test KLL Team

describe('TaskFilter', () => {
  it('offers an "Assigned to me" filter', async () => {
    const setStatusFn = jest.fn();
    const { user } = renderWithRouter(
      <IntlProviders>
        <TaskFilter userCanValidate={false} setStatusFn={setStatusFn} />
      </IntlProviders>,
    );
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText(/assigned to me/i));
    expect(setStatusFn).toHaveBeenCalledWith('ASSIGNED_TO_ME');
  });
});

describe('TaskList with assignments', () => {
  // the task page adds actionDate/actionBy from the activities (see updateTasksStatus)
  const tasksWithActivity = {
    ...tasksGeojson,
    features: tasksGeojson.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        actionDate: '2026-11-01T10:00:00Z',
        actionBy: 'someone',
      },
    })),
  };
  const tasks = mergeAssignmentsIntoTasks(
    tasksWithActivity,
    groupAssignmentsByTask(taskAssignments.assignments),
    420,
    [4],
  );

  const renderTaskList = (route) =>
    render(
      <MemoryRouter initialEntries={[route]}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <TaskList
              project={getProjectSummary(123)}
              tasks={tasks}
              selectTask={jest.fn()}
              selected={[]}
              setZoomedTaskId={jest.fn()}
              userContributions={[]}
              setTextSearch={jest.fn()}
            />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </MemoryRouter>,
    );

  it('shows only tasks assigned to the user or their teams with the filter', async () => {
    renderTaskList('/?filter=ASSIGNED_TO_ME');
    // task 1 is assigned to the user, task 3 to one of their teams (team 4)
    await waitFor(() => expect(screen.getByText('Task #1')).toBeInTheDocument());
    expect(screen.getByText('Task #3')).toBeInTheDocument();
    expect(screen.queryByText('Task #2')).not.toBeInTheDocument();
    expect(screen.queryByText('Task #4')).not.toBeInTheDocument();
  });

  it('shows the assignees on the task cards', async () => {
    renderTaskList('/?filter=ALL&sortBy=id');
    await waitFor(() => expect(screen.getByText('another_mapper')).toBeInTheDocument());
    expect(screen.getByText('Test KLL Team')).toBeInTheDocument();
  });
});

describe('TaskAssignees', () => {
  it('renders nothing without assignees', () => {
    const { container } = render(
      <IntlProviders>
        <TaskAssignees data={{ mappingAssignee: '', validationAssignee: '' }} />
      </IntlProviders>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the mapping and validation assignees', () => {
    render(
      <IntlProviders>
        <TaskAssignees
          data={{
            mappingAssignee: 'alice',
            mappingAssigneeIsTeam: false,
            validationAssignee: 'Validators',
            validationAssigneeIsTeam: true,
          }}
        />
      </IntlProviders>,
    );
    expect(screen.getByText(/mapping assigned to/i)).toHaveTextContent('Mapping assigned to alice');
    expect(screen.getByText(/validation assigned to/i)).toHaveTextContent(
      'Validation assigned to Validators (team)',
    );
  });
});

describe('AssignmentConflictAlert', () => {
  it('renders nothing without conflicts', () => {
    const { container } = render(
      <IntlProviders>
        <AssignmentConflictAlert assignments={[]} />
      </IntlProviders>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('warns when the task is assigned to someone else', () => {
    render(
      <IntlProviders>
        <AssignmentConflictAlert assignments={[userAssignment]} isBlocking={false} />
      </IntlProviders>,
    );
    expect(
      screen.getByText(/This task is assigned to another_mapper\. You can still work on it/i),
    ).toBeInTheDocument();
  });

  it('explains when assignment is enforced, naming teams', () => {
    render(
      <IntlProviders>
        <AssignmentConflictAlert assignments={[userAssignment, teamAssignment]} isBlocking />
      </IntlProviders>,
    );
    expect(
      screen.getByText(
        /Some of these tasks are assigned to another_mapper, Test KLL Team \(team\)\. In this project only the assignee/i,
      ),
    ).toBeInTheDocument();
  });
});

describe('TaskSelectionFooter with assignment conflicts', () => {
  const renderFooter = (isAssignmentBlocking) =>
    renderWithRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          project={getProjectSummary(123)}
          tasks={tasksGeojson}
          taskAction="mapSelectedTask"
          selectedTasks={[2]}
          assignmentConflicts={[userAssignment]}
          isAssignmentBlocking={isAssignmentBlocking}
        />
      </ReduxIntlProviders>,
    );

  it('keeps the action button enabled in soft mode', () => {
    renderFooter(false);
    expect(screen.getByText(/You can still work on it/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map selected task/i })).toBeEnabled();
  });

  it('disables the action button when assignment is enforced', () => {
    renderFooter(true);
    expect(screen.getByText(/only the assignee can work on assigned tasks/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map selected task/i })).toBeDisabled();
  });
});

describe('TaskSelectionFooter "Assign tasks" button', () => {
  const renderFooter = (props) =>
    renderWithRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          project={getProjectSummary(123)}
          tasks={tasksGeojson}
          taskAction="mapATask"
          selectedTasks={[]}
          {...props}
        />
      </ReduxIntlProviders>,
    );

  it('sits next to the mapping action for project managers', async () => {
    const onStartAssigning = jest.fn();
    const { user } = renderFooter({ onStartAssigning });
    expect(screen.getByRole('button', { name: /map a task/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Assign tasks' }));
    expect(onStartAssigning).toHaveBeenCalledTimes(1);
  });

  it('is hidden from everyone else', () => {
    renderFooter({});
    expect(screen.queryByRole('button', { name: 'Assign tasks' })).not.toBeInTheDocument();
  });
});

describe('AssignModeFooter', () => {
  const handlers = () => ({
    onSelectPriorityAreas: jest.fn(),
    onSelectUnassigned: jest.fn(),
    onClearSelection: jest.fn(),
    onAssign: jest.fn(),
    onUnassign: jest.fn(),
    onExit: jest.fn(),
  });

  it('offers selection shortcuts and actions for the selection', async () => {
    const props = handlers();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <AssignModeFooter selectedTasks={[1, 2]} hasPriorityAreas {...props} />
      </IntlProviders>,
    );
    expect(screen.getByText(/click tasks on the map/i)).toBeInTheDocument();
    expect(screen.getByText('2 tasks selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /select tasks in priority areas/i }));
    await user.click(screen.getByRole('button', { name: /select unassigned tasks/i }));
    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    await user.click(screen.getByRole('button', { name: 'Assign 2 tasks' }));
    await user.click(screen.getByRole('button', { name: 'Unassign 2 tasks' }));
    await user.click(screen.getByRole('button', { name: /done assigning/i }));
    Object.values(props).forEach((handler) => expect(handler).toHaveBeenCalledTimes(1));
  });

  it('hides the priority area shortcut when the project has none', () => {
    render(
      <IntlProviders>
        <AssignModeFooter selectedTasks={[1]} hasPriorityAreas={false} {...handlers()} />
      </IntlProviders>,
    );
    expect(screen.queryByText(/select tasks in priority areas/i)).not.toBeInTheDocument();
  });

  it('disables the selection actions without a selection, but not leaving', () => {
    render(
      <IntlProviders>
        <AssignModeFooter selectedTasks={[]} hasPriorityAreas {...handlers()} />
      </IntlProviders>,
    );
    expect(screen.getByRole('button', { name: 'Assign 0 tasks' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Unassign 0 tasks' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /done assigning/i })).toBeEnabled();
  });
});

describe('AssignTasksModal', () => {
  const project = {
    ...getProjectSummary(123),
    teams: [
      { teamId: 1, name: 'Team Test', role: 'MAPPER' },
      { teamId: 1, name: 'Team Test', role: 'VALIDATOR' },
    ],
  };

  beforeEach(() => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    });
  });

  const renderModal = (props = {}) => {
    const close = jest.fn();
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    render(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <AssignTasksModal
            project={project}
            taskIds={[1, 2]}
            close={close}
            onSuccess={onSuccess}
            {...props}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    return { close, onSuccess, user };
  };

  const chooseProjectTeam = async (user) => {
    await user.click(screen.getByRole('tab', { name: 'Team' }));
    await user.click(screen.getByRole('combobox'));
    // the project's teams are listed once each, even when they have several roles
    const options = await screen.findAllByText('Team Test');
    expect(options).toHaveLength(1);
    await user.click(options[0]);
  };

  it('does not submit without an assignee', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Assign 2 tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled();
  });

  it('assigns the tasks to a team for validation', async () => {
    let payload;
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/assign/', async (req, res, ctx) => {
        payload = await req.json();
        return res(ctx.json({ assigned: 2, warnings: [] }));
      }),
    );
    const { close, onSuccess, user } = renderModal();
    await chooseProjectTeam(user);
    await user.click(screen.getByRole('radio', { name: 'Validation' }));
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({ taskIds: [1, 2], stage: 'VALIDATION', notify: true, teamId: 1 });
  });

  it('assigns the tasks to a user found by username', async () => {
    let payload;
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/assign/', async (req, res, ctx) => {
        payload = await req.json();
        return res(ctx.json({ assigned: 2, warnings: [] }));
      }),
    );
    const { close, user } = renderModal();
    await user.type(screen.getByRole('combobox'), 'Ra');
    await user.click(await screen.findByText('Ram', {}, { timeout: 3000 }));
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(payload).toEqual({ taskIds: [1, 2], stage: 'MAPPING', notify: true, userId: 1 });
  });

  it('can skip notifications', async () => {
    let payload;
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/assign/', async (req, res, ctx) => {
        payload = await req.json();
        return res(ctx.json({ assigned: 2, warnings: [] }));
      }),
    );
    const { close, user } = renderModal();
    await chooseProjectTeam(user);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(payload).toMatchObject({ stage: 'MAPPING', notify: false });
  });

  it('shows the warnings returned by the API', async () => {
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/assign/', (req, res, ctx) =>
        res(ctx.json(assignTasksWithWarnings)),
      ),
    );
    const { close, onSuccess, user } = renderModal();
    await chooseProjectTeam(user);
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    expect(await screen.findByText(/Tasks assigned, but check this/i)).toBeInTheDocument();
    expect(
      screen.getByText(/mapping level is below what this project requires/i),
    ).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('shows the API error by SubCode', async () => {
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/assign/', (req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.json({ Error: 'Team is not on project', SubCode: 'TeamNotOnProject' }),
        ),
      ),
    );
    const { close, onSuccess, user } = renderModal();
    await chooseProjectTeam(user);
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    expect(await screen.findByText(/Add the team to the project/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});

describe('UnassignTasksModal', () => {
  it('removes the mapping assignments of the selected tasks', async () => {
    let payload;
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/unassign/', async (req, res, ctx) => {
        payload = await req.json();
        return res(ctx.json({ unassigned: 2 }));
      }),
    );
    const close = jest.fn();
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <UnassignTasksModal
          project={getProjectSummary(123)}
          taskIds={[1, 2]}
          close={close}
          onSuccess={onSuccess}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('radio', { name: 'Mapping and validation' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Mapping' }));
    await user.click(screen.getByRole('button', { name: 'Unassign' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({ taskIds: [1, 2], stage: 'MAPPING' });
  });

  it('sends no stage to remove both assignments', async () => {
    let payload;
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/unassign/', async (req, res, ctx) => {
        payload = await req.json();
        return res(ctx.json({ unassigned: 3 }));
      }),
    );
    const close = jest.fn();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <UnassignTasksModal project={getProjectSummary(123)} taskIds={[1, 2]} close={close} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByRole('button', { name: 'Unassign' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(payload).toEqual({ taskIds: [1, 2] });
  });

  it('keeps the dialog open on error', async () => {
    server.use(
      rest.post(API_URL + 'projects/:id/tasks/actions/unassign/', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ Error: 'boom' })),
      ),
    );
    const close = jest.fn();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <UnassignTasksModal project={getProjectSummary(123)} taskIds={[1]} close={close} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByRole('button', { name: 'Unassign' }));
    expect(await screen.findByText(/could not be removed/i)).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });
});
