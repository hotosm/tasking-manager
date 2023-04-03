import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

import {
  CompletionTabForMapping,
  CompletionTabForValidation,
  ReopenEditor,
  SidebarToggle,
} from '../actionSidebars';
import {
  createComponentWithMemoryRouter,
  IntlProviders,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { setupFaultyHandlers } from '../../../network/tests/server';
import messages from '../messages';
import { store } from '../../../store';
import { TaskMapAction } from '../action';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';
import { userMultipleLockedTasksDetails } from '../../../network/tests/mockData/userStats';

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

describe('Appearance of unsaved map changes to be dealt with while mapping', () => {
  test('when splitting a task', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping project={{ projectId: 123 }} disabled />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(screen.getByRole('button', { name: /split task/i }));
    expect(
      screen.getByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /close/i,
      }),
    );
    expect(
      screen.queryByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });

  test('when submitting a task', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping project={{ projectId: 123 }} disabled />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    const button = screen.getByRole('button', { name: 'Submit task' });
    expect(button).toBeDisabled();
    await user.hover(button);
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
    expect(screen.getByText(messages.unsavedChangesTooltip.defaultMessage)).toBeInTheDocument();
  });

  test('when selecting another task', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping project={{ projectId: 123 }} disabled />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /select another task/i,
      }),
    );
    expect(
      screen.getByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).toBeInTheDocument();
  });
});

describe('Miscellaneous modals and prompts', () => {
  test('should display/hide split task error', async () => {
    setupFaultyHandlers();
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping project={{ projectId: 123 }} tasksIds={[1997]} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    await user.click(
      screen.getByRole('button', {
        name: /split task/i,
      }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  });

  test('should prompt the user to read comments', async () => {
    const historyTabSwitchMock = jest.fn();
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping
            project={{ projectId: 123 }}
            showReadCommentsAlert
            historyTabSwitch={historyTabSwitchMock}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    expect(screen.getByText(messages.readTaskComments.defaultMessage)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: messages.readTaskComments.defaultMessage,
      }),
    );
    expect(historyTabSwitchMock).toHaveBeenCalledTimes(1);
  });

  test('should display/hide help text', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping project={{ projectId: 123 }} showReadCommentsAlert />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(screen.getByLabelText('toggle help'));
    expect(screen.getByText(messages.instructionsSelect.defaultMessage)).toBeInTheDocument();
    await user.click(screen.getByLabelText('hide instructions'));
    expect(screen.queryByText(messages.instructionsSelect.defaultMessage)).not.toBeInTheDocument();
  });

  test('should display/hide task specific instructions', async () => {
    const instruction = 'this is a sample instruction';
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForMapping project={{ projectId: 123 }} taskInstructions={instruction} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    expect(screen.getByText(instruction)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: messages.taskExtraInfo.defaultMessage,
      }),
    );
    expect(screen.queryByText(instruction)).not.toBeInTheDocument();
  });

  test('should display/hide task specific instructions', async () => {
    const instruction = 'this is a sample instruction';
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForValidation
            project={{ projectId: 123 }}
            taskInstructions={instruction}
            validationStatus={{}}
            tasksIds={[]}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    expect(screen.queryByText(instruction)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: messages.taskExtraInfo.defaultMessage,
      }),
    );
    expect(screen.getByText(instruction)).toBeInTheDocument();
  });
});

describe('Appearance of unsaved map changes to be dealt with while validating', () => {
  test('when stopping validation session', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForValidation
            project={{ projectId: 123 }}
            disabled
            validationStatus={{}}
            tasksIds={[]}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(screen.getByRole('button', { name: /stop validation/i }));
    expect(
      screen.getByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /close/i,
      }),
    );
    expect(
      screen.queryByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });

  test('when submitting a task', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForValidation
            project={{ projectId: 123 }}
            disabled
            validationStatus={{}}
            tasksIds={[]}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    const button = screen.getByRole('button', { name: 'Submit task' });
    expect(button).toBeDisabled();
    await user.hover(button);
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
    expect(screen.getByText(messages.unsavedChangesTooltip.defaultMessage)).toBeInTheDocument();
  });
});

describe('Completion Tab for Validation', () => {
  it('should update status and comments for multiple tasks', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForValidation
            project={{ projectId: 123 }}
            validationStatus={{}}
            tasksIds={[1997, 1998]}
            validationComments={{}}
            contributors={[]}
            setValidationStatus={jest.fn()}
            setValidationComments={jest.fn()}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(
      screen.getAllByRole('radio', {
        name: /yes/i,
      })[0],
    );
    await user.click(
      screen.getAllByRole('radio', {
        name: /yes/i,
      })[1],
    );
    await user.click(
      screen.getAllByRole('button', {
        name: /comment/i,
      })[0],
    );
    await user.click(
      screen.getAllByRole('button', {
        name: /comment/i,
      })[1],
    );
    await user.type(screen.getAllByRole('textbox')[0], 'comment 1');
    await user.type(screen.getAllByRole('textbox')[1], 'comment 2');
    await user.click(
      screen.getByRole('button', {
        name: /stop validation/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should display radio to mark all tasks', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <CompletionTabForValidation
            project={{ projectId: 123 }}
            validationStatus={{
              1997: 'VALIDATED',
              1998: 'VALIDATED',
              1999: 'VALIDATED',
              2000: 'VALIDATED',
            }}
            tasksIds={[1997, 1998, 1999, 2000]}
            validationComments={{}}
            contributors={[]}
            setValidationStatus={jest.fn()}
            setValidationComments={jest.fn()}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    await user.click(
      screen.getByRole('button', {
        name: /submit task/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });
});

describe('Toggling display of the sidebar', () => {
  it('should call the sidebar toggle function for ID editor', async () => {
    const restartMock = jest.fn();
    const user = userEvent.setup();
    const context = {
      ui: jest.fn().mockReturnValue({
        restart: restartMock,
      }),
    };
    act(() => {
      store.dispatch({ type: 'SET_EDITOR', context: context });
    });
    const setShowSidebarMock = jest.fn();
    render(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <SidebarToggle setShowSidebar={setShowSidebarMock} activeEditor="ID" />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /hide sidebar/i,
      }),
    );
    expect(setShowSidebarMock).toHaveBeenCalledTimes(1);
    expect(restartMock).toHaveBeenCalledTimes(1);
  });

  it('should call the sidebar toggle function for RAPID editor', async () => {
    // Testing the resize call cannot be done currently, due to the following reasons:
    // 1. Jest cannot mock/spy on the function call
    // 2. The test environment doesn't have width/height information
    // 3. The resize call in Rapid cannot be mocked since it is difficult to (a) get the context and (b) mock the call prior to full initialization.
    // const resizeMock = jest.fn();
    // expect(resizeMock).toHaveBeenCalledTimes(1); // This should be at the end of the test
    const user = userEvent.setup();
    const { getByRole, queryByRole } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <TaskMapAction
            project={getProjectSummary(123)}
            projectIsReady
            tasks={tasksGeojson}
            activeTasks={userMultipleLockedTasksDetails.tasks}
            action="MAPPING"
            editor="RAPID"
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(
      getByRole('button', {
        name: 'Hide sidebar',
      }),
    );
    expect(getByRole('generic', { name: 'Show sidebar' })).toBeVisible();
    expect(queryByRole('button', { name: 'Hide sidebar' })).toBeNull();
  });
});

test('default value for the reload editor dropdown', () => {
  render(
    <IntlProviders>
      <ReopenEditor action="MAPPING" editor="ID" project={{ mappingEditors: ['ID'] }} />
    </IntlProviders>,
  );
  expect(
    screen.getByRole('button', {
      name: /iD Editor/i,
    }),
  ).toBeInTheDocument();
});
