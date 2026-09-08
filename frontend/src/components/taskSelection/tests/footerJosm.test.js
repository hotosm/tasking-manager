import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';

import * as jsonRequests from '../../../network/genericJSONRequest';
import * as editorUtils from '../../../utils/openEditor';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';
import { createComponentWithMemoryRouter, ReduxIntlProviders } from '../../../utils/testWithIntl';
import { store } from '../../../store';
import TaskSelectionFooter from '../footer';
import messages from '../messages';

describe('JOSM popup reservation during task locking', () => {
  let originalSafari;
  let popup;
  let open;
  let lock;
  let launch;

  beforeEach(() => {
    originalSafari = window.safari;
    window.safari = {};
    popup = { closed: false, close: jest.fn() };
    open = jest.spyOn(window, 'open').mockReturnValue(popup);
    lock = jest.spyOn(jsonRequests, 'fetchLocalJSONAPI');
    launch = jest.spyOn(editorUtils, 'openEditor').mockReturnValue('?editor=JOSM');
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
  });

  afterEach(() => {
    window.safari = originalSafari;
    jest.restoreAllMocks();
  });

  const renderFooter = () =>
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="JOSM"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="mapATask"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );

  it('reserves a window before locking and passes it to the editor after locking', async () => {
    let finishLock;
    lock.mockImplementation(() => {
      expect(open).toHaveBeenCalledTimes(1);
      return new Promise((resolve) => {
        finishLock = resolve;
      });
    });
    const { user } = renderFooter();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /map a task/i }));
    });

    expect(lock).toHaveBeenCalledTimes(1);
    expect(launch).not.toHaveBeenCalled();
    await act(async () => finishLock({}));
    expect(launch.mock.calls[0][5]).toBe(popup);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('closes the reserved popup when task locking fails', async () => {
    lock.mockRejectedValueOnce(new Error('LockFailed'));
    const { user } = renderFooter();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /map a task/i }));
    });

    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(launch).not.toHaveBeenCalled();
  });

  it('does not lock the task when a popup cannot be opened', async () => {
    open.mockReturnValue(null);
    const { user } = renderFooter();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /map a task/i }));
    });

    expect(lock).not.toHaveBeenCalled();
    expect(launch).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: messages.JOSMError.defaultMessage }),
    ).toBeInTheDocument();
  });
});
